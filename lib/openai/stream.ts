import OpenAI from "openai";
import { buildContextFromMessages, buildContextUpToMessage } from "./context";
import { MessageRole } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function streamChatResponse(
  messages: Array<{
    role: MessageRole;
    content: string;
    id: string;
  }>,
  userMessage: string
) {
  const contextMessages = buildContextFromMessages(messages);

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      ...contextMessages,
      {
        role: "user",
        content: userMessage,
      },
    ],
    stream: true,
  });

  return stream;
}

export async function streamChatResponseWithContext(
  contextMessages: Array<{
    role: MessageRole;
    content: string;
    id: string;
  }>,
  upToMessageId: string,
  userMessage: string,
  selectedText?: string
) {
  const messages = buildContextUpToMessage(contextMessages, upToMessageId);

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

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      ...messages,
      ...systemContext,
      {
        role: "user",
        content: userMessage,
      },
    ],
    stream: true,
  });

  return stream;
}
