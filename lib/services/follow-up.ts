import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function createFollowUpWindow(
  boardId: string,
  sourceWindowId: string,
  sourceMessageId: string,
  selectedText: string,
  title: string,
  positionX: number,
  positionY: number
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Optimize: Verify board ownership in a single query
  // Check if board exists and belongs to user with this email
  // This reduces database round trips from 3 queries to 1
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      user: {
        email: user.email!,
      },
    },
    select: {
      id: true, // Only select what we need for verification
    },
  });

  if (!board) {
    throw new Error("Board not found or unauthorized");
  }

  // Get source window to inherit modelId
  const sourceWindow = await prisma.chatWindow.findUnique({
    where: { id: sourceWindowId },
    select: { modelId: true },
  })

  // Create window and edge in a transaction to ensure atomicity
  // Board verification is already done above, so we can proceed directly
  return prisma.$transaction(async (tx) => {
    // Create the follow-up window with inherited modelId
    const newWindow = await tx.chatWindow.create({
      data: {
        boardId,
        title,
        positionX,
        positionY,
        modelId: sourceWindow?.modelId || 'openai/gpt-4o',
      },
    });

    // Create the edge connecting source to follow-up window
    const edge = await tx.edge.create({
      data: {
        boardId,
        sourceWindowId,
        targetWindowId: newWindow.id,
        selectedText,
        sourceMessageId,
      },
    });

    return {
      window: newWindow,
      edge,
    };
  });
}
