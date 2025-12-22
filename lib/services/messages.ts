import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { MessageRole } from '@prisma/client'

export async function createMessage(
  chatWindowId: string,
  role: MessageRole,
  content: string
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  })

  if (!dbUser) {
    throw new Error('User not found')
  }

  // Verify window belongs to user's board
  const window = await prisma.chatWindow.findFirst({
    where: {
      id: chatWindowId,
      board: {
        userId: dbUser.id,
      },
    },
  })

  if (!window) {
    throw new Error('Window not found')
  }

  return prisma.message.create({
    data: {
      chatWindowId,
      role,
      content,
    },
  })
}

export async function updateMessage(messageId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  })

  if (!dbUser) {
    throw new Error('User not found')
  }

  // Verify message belongs to user's board
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      chatWindow: {
        board: {
          userId: dbUser.id,
        },
      },
    },
  })

  if (!message) {
    throw new Error('Message not found')
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { content },
  })
}

