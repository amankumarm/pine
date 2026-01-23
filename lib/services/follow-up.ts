import { prisma } from "@/lib/prisma";
import { getCurrentUserFromSession } from "@/lib/auth";

export async function createFollowUpWindow(
  boardId: string,
  sourceWindowId: string,
  sourceMessageId: string,
  selectedText: string,
  title: string,
  positionX: number,
  positionY: number,
) {
  const user = await getCurrentUserFromSession();

  if (!user?.email) {
    throw new Error("Unauthorized");
  }

  // Get user ID first (fast, uses unique index on users.email)
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  // Single optimized query with database-level filtering
  const sourceWindow = await prisma.chatWindow.findFirst({
    where: {
      id: sourceWindowId,
      boardId: boardId, // Validate boardId match at DB level
      board: { userId: dbUser.id }, // Validate ownership at DB level
    },
    select: { modelId: true, boardId: true },
  });

  if (!sourceWindow) {
    throw new Error("Source window not found or unauthorized");
  }

  // Transaction for atomic create
  const result = await prisma.$transaction(async (tx) => {
    const newWindow = await tx.chatWindow.create({
      data: {
        boardId,
        title,
        positionX,
        positionY,
        modelId: sourceWindow.modelId,
      },
    });

    const edge = await tx.edge.create({
      data: {
        boardId,
        sourceWindowId,
        targetWindowId: newWindow.id,
        selectedText,
        sourceMessageId,
      },
    });

    return { window: newWindow, edge };
  });

  return result;
}
