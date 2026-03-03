import { prisma } from '@/config/database';
import type { PrismaTransaction } from '@/config/database';
import { logger } from '@/shared/utils/logger';

export class PrismaTransactionManager {
  async runInTransaction<T>(operation: (tx: PrismaTransaction) => Promise<T>): Promise<T> {
    try {
      return await prisma.$transaction(
        async (tx: PrismaTransaction) => operation(tx),
        {
          maxWait: 5000,
          timeout: 10000,
        },
      );
    } catch (error: unknown) {
      logger.error('Error running Prisma transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
