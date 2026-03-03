import { PrismaClient } from '@prisma/client';

export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client.
 * In development, reuses the global instance to avoid exhausting connections
 * during hot-reload cycles.
 */
const createPrismaClient = (): PrismaClient => {
  if (process.env['NODE_ENV'] === 'production') {
    return new PrismaClient();
  }

  if (global.__prisma === undefined) {
    global.__prisma = new PrismaClient();
  }

  return global.__prisma;
};

const prisma = createPrismaClient();

export { prisma };
