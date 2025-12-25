import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getOrCreateUserBoard() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Find or create user in database
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: user.email!,
      },
    });
  }

  // Check if user already has a board
  let board = await prisma.board.findFirst({
    where: { userId: dbUser.id },
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

  // If no board exists, create one with a default chat window
  if (!board) {
    board = await prisma.board.create({
      data: {
        userId: dbUser.id,
        name: "Canvas",
        chatWindows: {
          create: {
            title: "New Chat",
            positionX: 250,
            positionY: 100,
          },
        },
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
  }

  return board;
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
