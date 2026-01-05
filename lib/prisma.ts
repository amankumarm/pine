import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [{ emit: "event", level: "query" }],
  });

// Log queries with duration
prisma.$on("query" as never, (e: Prisma.QueryEvent) => {
  console.log(`prisma:query ${e.query}`);
  console.log(`Duration: ${e.duration}ms`);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
