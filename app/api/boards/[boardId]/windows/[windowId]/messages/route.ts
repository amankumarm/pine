import { NextRequest, NextResponse } from "next/server";
import { createMessage, updateMessage } from "@/lib/services/messages";
import {
  getWindowWithMessages,
  updateWindowTitle,
} from "@/lib/services/windows";
import {
  streamChatResponse,
  streamChatResponseWithContext,
} from "@/lib/ai/stream";
import { generateConversationTitle } from "@/lib/openai/title";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MessageRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; windowId: string }> }
) {
  try {
    const { boardId, windowId } = await params;
    const body = await request.json();
    const { content, contextMessageId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Create user message
    const userMessage = await createMessage(
      windowId,
      MessageRole.USER,
      content
    );

    // Get window with messages for context
    const window = await getWindowWithMessages(windowId);

    // Get modelId from window (defaults to openai/gpt-4o if not set)
    const modelId = window.modelId || "openai/gpt-4o";

    // Check if this is a follow-up window (has incoming edge)
    // If so, get context from source window
    const actualContextMessageId = contextMessageId;
    if (!actualContextMessageId && window.messages.length === 1) {
      // First message in window, check for incoming edge
      const user = await getCurrentUser();
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          const incomingEdge = await prisma.edge.findFirst({
            where: {
              boardId,
              targetWindowId: windowId,
              board: {
                userId: dbUser.id,
              },
            },
            include: {
              sourceWindow: {
                include: {
                  messages: {
                    orderBy: { createdAt: "asc" },
                  },
                },
              },
            },
          });

          if (incomingEdge) {
            // Use source window messages as context
            // Get all messages from source window up to and including the selected message
            const sourceMessages = incomingEdge.sourceWindow.messages;

            console.log("[Follow-up Context Debug]", {
              sourceWindowId: incomingEdge.sourceWindowId,
              targetWindowId: incomingEdge.targetWindowId,
              sourceMessageId: incomingEdge.sourceMessageId,
              selectedText:
                incomingEdge.selectedText?.substring(0, 100) + "...",
              sourceMessagesCount: sourceMessages.length,
              sourceMessageIds: sourceMessages.map((m) => m.id),
            });

            // Verify sourceMessageId exists in sourceMessages
            const selectedMessageIndex = sourceMessages.findIndex(
              (m) => m.id === incomingEdge.sourceMessageId
            );

            if (selectedMessageIndex === -1) {
              // Fallback: use all source messages if selected message not found
              console.warn(
                `Selected message ${incomingEdge.sourceMessageId} not found in source window`
              );
            } else {
              console.log(
                "[Follow-up Context Debug] Selected message found at index:",
                selectedMessageIndex
              );
            }

            // Create assistant message placeholder
            const assistantMessage = await createMessage(
              windowId,
              MessageRole.ASSISTANT,
              ""
            );

            // Stream with context - buildContextUpToMessage will slice messages up to selected message
            const result = await streamChatResponseWithContext(
              sourceMessages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
              })),
              incomingEdge.sourceMessageId,
              content,
              modelId,
              incomingEdge.selectedText
            );

            // Stream the response and collect full content
            const encoder = new TextEncoder();
            let fullContent = "";
            const readable = new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of result.textStream) {
                    fullContent += chunk;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          delta: chunk,
                          messageId: assistantMessage.id,
                        })}\n\n`
                      )
                    );
                  }

                  // Update message with full content
                  await updateMessage(assistantMessage.id, fullContent);

                  // Generate title after first assistant message
                  const windowAfterUpdate = await getWindowWithMessages(
                    windowId
                  );
                  const assistantMessages = windowAfterUpdate.messages.filter(
                    (m) => m.role === MessageRole.ASSISTANT
                  );
                  if (
                    assistantMessages.length === 1 &&
                    windowAfterUpdate.title === "New Chat"
                  ) {
                    // First assistant message, generate title
                    const userMessages = windowAfterUpdate.messages.filter(
                      (m) => m.role === MessageRole.USER
                    );
                    if (userMessages.length > 0) {
                      try {
                        const title = await generateConversationTitle(
                          userMessages[0].content,
                          fullContent
                        );
                        await updateWindowTitle(windowId, title);
                      } catch (error) {
                        console.error("Error generating title:", error);
                      }
                    }
                  }

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        done: true,
                        messageId: assistantMessage.id,
                      })}\n\n`
                    )
                  );
                  controller.close();
                } catch (error) {
                  console.error("Streaming error:", error);
                  controller.error(error);
                }
              },
            });

            return new Response(readable, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }
        }
      }
    }

    // Create assistant message placeholder
    const assistantMessage = await createMessage(
      windowId,
      MessageRole.ASSISTANT,
      ""
    );

    // Stream response
    const result = actualContextMessageId
      ? await streamChatResponseWithContext(
          window.messages,
          actualContextMessageId,
          content,
          modelId
        )
      : await streamChatResponse(window.messages, content, modelId);

    // Stream the response and collect full content
    const encoder = new TextEncoder();
    let fullContent = "";
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullContent += chunk;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  delta: chunk,
                  messageId: assistantMessage.id,
                })}\n\n`
              )
            );
          }

          // Update message with full content
          await updateMessage(assistantMessage.id, fullContent);

          // Generate title after first assistant message
          const windowAfterUpdate = await getWindowWithMessages(windowId);
          const assistantMessages = windowAfterUpdate.messages.filter(
            (m) => m.role === MessageRole.ASSISTANT
          );
          if (
            assistantMessages.length === 1 &&
            windowAfterUpdate.title === "New Chat"
          ) {
            // First assistant message, generate title
            const userMessages = windowAfterUpdate.messages.filter(
              (m) => m.role === MessageRole.USER
            );
            if (userMessages.length > 0) {
              try {
                const title = await generateConversationTitle(
                  userMessages[0].content,
                  fullContent
                );
                await updateWindowTitle(windowId, title);
              } catch (error) {
                console.error("Error generating title:", error);
              }
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                messageId: assistantMessage.id,
              })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
