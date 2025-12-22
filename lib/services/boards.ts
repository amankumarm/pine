import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getUserBoards() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Find user in database by email
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  return prisma.board.findMany({
    where: { userId: dbUser.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getBoardById(boardId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      userId: dbUser.id,
    },
    include: {
      chatWindows: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      edges: {
        include: {
          sourceMessage: true,
        },
      },
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  return board;
}

export async function createBoard(name: string, description?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  let dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    // Create user if doesn't exist
    dbUser = await prisma.user.create({
      data: {
        email: user.email!,
      },
    });
  }

  const board = await prisma.board.create({
    data: {
      userId: dbUser.id,
      name,
      description,
      chatWindows: {
        create: {
          title: "New Chat",
          positionX: 250,
          positionY: 100,
        },
      },
    },
    include: {
      chatWindows: true,
    },
  });

  return board;
}
