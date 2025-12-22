import { MessageRole } from '@prisma/client'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function buildContextFromMessages(
  messages: Array<{
    role: MessageRole
    content: string
  }>
): Message[] {
  return messages.map((msg) => ({
    role: msg.role.toLowerCase() as 'user' | 'assistant',
    content: msg.content,
  }))
}

export function buildContextUpToMessage(
  messages: Array<{
    role: MessageRole
    content: string
    id: string
  }>,
  upToMessageId: string
): Message[] {
  // Find the index of the message we want to include up to
  const upToIndex = messages.findIndex((m) => m.id === upToMessageId)
  
  if (upToIndex === -1) {
    // If message not found, return all messages as fallback
    console.warn(`Message ${upToMessageId} not found, using all messages`)
    return buildContextFromMessages(messages)
  }

  // Include all messages up to and including the selected message
  // This gives context from the start of the conversation to the point where text was selected
  return buildContextFromMessages(messages.slice(0, upToIndex + 1))
}

