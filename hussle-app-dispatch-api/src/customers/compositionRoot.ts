import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { customerRepositoryPrisma } from './repositories/customerRepositoryPrisma';
import { customerStatsQueryPrisma } from './repositories/customerStatsQueryPrisma';
import { createCustomerService } from './services/customerService';
import { createCustomerControllers } from './controllers/customerController';
import type { CustomerControllers } from './controllers/customerController';

interface CustomerModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
}

export const createCustomersModule = ({
  prismaClient,
}: CustomerModuleDeps): {
  controllers: CustomerControllers;
} => {
  const customerRepository = customerRepositoryPrisma(prismaClient);
  const customerStatsQuery = customerStatsQueryPrisma(prismaClient);

  const customerService = createCustomerService({
    customerRepository,
  });

  const controllers = createCustomerControllers({
    customerService,
    customerStatsQuery,
  });

  return { controllers };
};
