import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

function createPrismaClient() {
  return new PrismaClient({
    log: ["error"],
  }).$extends(withAccelerate());
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
