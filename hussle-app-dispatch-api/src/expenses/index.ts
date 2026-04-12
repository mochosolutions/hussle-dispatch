import { prisma } from '@/shared/prisma';
import { createStorageProvider } from '@/shared/storage';
import { sharedEventBus } from '@/shared/messaging';
import { env } from '@/config/env';
import { s3Client } from '@/config/s3';
import { logger } from '@/shared/utils/logger';
import { trackingTokenRepositoryPrisma } from '@/notifications/repositories/trackingTokenRepositoryPrisma';
import { createExpenseModule } from './compositionRoot';
import { createExpenseRouter } from './routes/expenseRoutes';
import { createRecurringExpenseRouter } from './routes/recurringExpenseRoutes';
import { createDriverPortalExpenseRouter } from './routes/driverPortalExpenseRoutes';

const storageProvider = createStorageProvider(
  env.STORAGE_BACKEND === 's3'
    ? {
        backend: 's3',
        s3Client,
        bucket: env.S3_BUCKET,
        region: env.AWS_REGION,
      }
    : {
        backend: 'local',
        basePath: env.STORAGE_LOCAL_PATH,
        baseUrl: `http://localhost:${String(env.PORT)}/api/v1/storage`,
      },
  logger,
);

const tokenRepo = trackingTokenRepositoryPrisma(prisma);

const expenseModule = createExpenseModule({
  prismaClient: prisma,
  storageProvider,
  eventBus: sharedEventBus,
  logger,
  tokenRepo,
});

export const expensesRouter = createExpenseRouter(expenseModule.controllers);
export const recurringExpensesRouter = createRecurringExpenseRouter(
  expenseModule.controllers.recurringExpense,
);
export const driverPortalExpensesRouter = createDriverPortalExpenseRouter(
  expenseModule.controllers.driverPortalExpense,
  expenseModule.middleware,
);
