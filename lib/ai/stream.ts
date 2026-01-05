import { createGateway } from "@ai-sdk/gateway";
import { streamText } from "ai";
import {
  buildContextFromMessages,
  buildContextUpToMessage,
} from "../openai/context";
import { MessageRole } from "@prisma/client";
import { DEFAULT_MODEL, isValidModelId } from "./models";

// Create Vercel AI Gateway provider
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function streamChatResponse(
  messages: Array<{
    role: MessageRole;
    content: string;
    id: string;
  }>,
  userMessage: string,
  modelId: string = DEFAULT_MODEL
) {
  // Validate modelId - use full model ID (e.g., "openai/gpt-4o")
  const validModelId = isValidModelId(modelId) ? modelId : DEFAULT_MODEL;

  const contextMessages = buildContextFromMessages(messages);

  const result = await streamText({
    model: gateway(validModelId),
    messages: [
      ...contextMessages,
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return result;
}

export async function streamChatResponseWithContext(
  contextMessages: Array<{
    role: MessageRole;
    content: string;
    id: string;
  }>,
  upToMessageId: string,
  userMessage: string,
  modelId: string = DEFAULT_MODEL,
  selectedText?: string
) {
  // Validate modelId - use full model ID (e.g., "openai/gpt-4o")
  const validModelId = isValidModelId(modelId) ? modelId : DEFAULT_MODEL;

  const messages = buildContextUpToMessage(contextMessages, upToMessageId);

  console.log('[streamChatResponseWithContext Debug]', {
    inputMessagesCount: contextMessages.length,
    upToMessageId,
    outputMessagesCount: messages.length,
    selectedTextLength: selectedText?.length || 0,
    userMessage: userMessage.substring(0, 100),
  });

  // Include selected text as system context if provided
  const systemContext = selectedText
    ? [
        {
          role: "system" as const,
          content: `The user selected this text from the previous response and is asking a follow-up question about it:\n\n"${selectedText.slice(
            0,
            2000
          )}"`,
        },
      ]
    : [];

  const finalMessages = [
    ...messages,
    ...systemContext,
    {
      role: "user" as const,
      content: userMessage,
    },
  ];

  console.log('[streamChatResponseWithContext Debug] Final messages to AI:', 
    finalMessages.map(m => ({ role: m.role, contentLength: m.content.length }))
  );

  const result = await streamText({
    model: gateway(validModelId),
    messages: finalMessages,
  });

  return result;
}
