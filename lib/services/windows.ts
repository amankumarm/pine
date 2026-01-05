import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function createChatWindow(
  boardId: string,
  title: string,
  positionX: number,
  positionY: number
) {
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

  // Verify board belongs to user
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      userId: dbUser.id,
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  return prisma.chatWindow.create({
    data: {
      boardId,
      title,
      positionX,
      positionY,
    },
  });
}

export async function updateWindowPosition(
  windowId: string,
  positionX: number,
  positionY: number
) {
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

  // Verify window belongs to user's board
  const window = await prisma.chatWindow.findFirst({
    where: {
      id: windowId,
      board: {
        userId: dbUser.id,
      },
    },
  });

  if (!window) {
    throw new Error("Window not found");
  }

  return prisma.chatWindow.update({
    where: { id: windowId },
    data: {
      positionX,
      positionY,
    },
  });
}

export async function getWindowWithMessages(windowId: string) {
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

  const window = await prisma.chatWindow.findFirst({
    where: {
      id: windowId,
      board: {
        userId: dbUser.id,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!window) {
    throw new Error("Window not found");
  }

  return window;
}

export async function getWindowContext(windowId: string) {
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

  const window = await prisma.chatWindow.findFirst({
    where: {
      id: windowId,
      board: {
        userId: dbUser.id,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      board: {
        include: {
          chatWindows: {
            include: {
              messages: {
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!window) {
    throw new Error("Window not found");
  }

  return window;
}

export async function updateWindowTitle(windowId: string, title: string) {
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

  // Verify window belongs to user's board
  const window = await prisma.chatWindow.findFirst({
    where: {
      id: windowId,
      board: {
        userId: dbUser.id,
      },
    },
  });

  if (!window) {
    throw new Error("Window not found");
  }

  return prisma.chatWindow.update({
    where: { id: windowId },
    data: { title },
  });
}

export async function updateWindowModel(windowId: string, modelId: string) {
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

  // Verify window belongs to user's board
  const window = await prisma.chatWindow.findFirst({
    where: {
      id: windowId,
      board: {
        userId: dbUser.id,
      },
    },
  });

  if (!window) {
    throw new Error("Window not found");
  }

  return prisma.chatWindow.update({
    where: { id: windowId },
    data: { modelId },
  });
}
