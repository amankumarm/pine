import OpenAI from 'openai'
import { buildContextFromMessages, buildContextUpToMessage } from './context'
import { MessageRole } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function streamChatResponse(
  messages: Array<{
    role: MessageRole
    content: string
    id: string
  }>,
  userMessage: string
) {
  const contextMessages = buildContextFromMessages(messages)
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      ...contextMessages,
      {
        role: 'user',
        content: userMessage,
      },
    ],
    stream: true,
  })

  return stream
}

export async function streamChatResponseWithContext(
  contextMessages: Array<{
    role: MessageRole
    content: string
    id: string
  }>,
  upToMessageId: string,
  userMessage: string
) {
  const messages = buildContextUpToMessage(contextMessages, upToMessageId)
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      ...messages,
      {
        role: 'user',
        content: userMessage,
      },
    ],
    stream: true,
  })

  return stream
}

