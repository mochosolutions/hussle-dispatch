import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { StorageProvider } from '@/shared/storage';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { TrackingTokenRepoPort } from '@/notifications/types/trackingTokenTypes';
import { expenseRepositoryPrisma } from './repositories/expenseRepositoryPrisma';
import { vehicleOrgQueryPrisma } from './repositories/vehicleOrgQueryPrisma';
import { createExpenseService } from './services/expenseService';
import { createExpenseControllers } from './controllers/expenseController';
import type { ExpenseControllers } from './controllers/expenseController';
import { createReceiptService } from './services/receiptService';
import { createReceiptControllers } from './controllers/receiptController';
import type { ReceiptControllers } from './controllers/receiptController';
import { recurringExpenseRepositoryPrisma } from './repositories/recurringExpenseRepositoryPrisma';
import { createRecurringExpenseService } from './services/recurringExpenseService';
import { createRecurringExpenseControllers } from './controllers/recurringExpenseController';
import type { RecurringExpenseControllers } from './controllers/recurringExpenseController';
import { createDriverPortalExpenseControllers } from './controllers/driverPortalExpenseController';
import type { DriverPortalExpenseControllers } from './controllers/driverPortalExpenseController';
import { createAuthenticateVehicleToken } from './middleware/authenticateVehicleToken';
import type { RequestHandler } from 'express';

interface ExpenseModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  storageProvider: StorageProvider;
  eventBus: EventBus;
  logger: Logger;
  tokenRepo: TrackingTokenRepoPort;
}

export const createExpenseModule = ({
  prismaClient,
  storageProvider,
  eventBus,
  logger,
  tokenRepo,
}: ExpenseModuleDeps): {
  controllers: {
    expense: ExpenseControllers;
    receipt: ReceiptControllers;
    recurringExpense: RecurringExpenseControllers;
    driverPortalExpense: DriverPortalExpenseControllers;
  };
  middleware: {
    authenticateVehicleToken: RequestHandler;
  };
} => {
  const expenseRepo = expenseRepositoryPrisma(prismaClient);
  const vehicleOrgQuery = vehicleOrgQueryPrisma(prismaClient);

  const expenseService = createExpenseService({
    expenseRepo,
    logger,
    eventBus,
  });

  const receiptService = createReceiptService({
    expenseRepo,
    storageProvider,
    logger,
  });

  const recurringExpenseRepo = recurringExpenseRepositoryPrisma(prismaClient);

  const recurringExpenseService = createRecurringExpenseService({
    recurringExpenseRepo,
    expenseRepo,
    eventBus,
    logger,
  });

  const expenseControllers = createExpenseControllers({ expenseService });
  const receiptControllers = createReceiptControllers({ receiptService });
  const recurringExpenseControllers = createRecurringExpenseControllers({
    recurringExpenseService,
  });
  const driverPortalExpenseControllers = createDriverPortalExpenseControllers({
    expenseService,
    vehicleOrgQuery,
  });

  const authenticateVehicleToken = createAuthenticateVehicleToken({ tokenRepo });

  return {
    controllers: {
      expense: expenseControllers,
      receipt: receiptControllers,
      recurringExpense: recurringExpenseControllers,
      driverPortalExpense: driverPortalExpenseControllers,
    },
    middleware: {
      authenticateVehicleToken,
    },
  };
};
