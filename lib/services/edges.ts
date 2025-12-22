import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function createEdge(
  boardId: string,
  sourceWindowId: string,
  targetWindowId: string,
  selectedText: string,
  sourceMessageId: string
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

  // Verify board belongs to user
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      userId: dbUser.id,
    },
  })

  if (!board) {
    throw new Error('Board not found')
  }

  return prisma.edge.create({
    data: {
      boardId,
      sourceWindowId,
      targetWindowId,
      selectedText,
      sourceMessageId,
    },
  })
}

