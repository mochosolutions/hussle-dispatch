import { prisma } from '@/shared/prisma';
import { createSettingsModule } from './compositionRoot';
import { createSettingsRouter } from './routes/settingsRoutes';

const settingsModule = createSettingsModule({
  prismaClient: prisma,
});

export const settingsRouter = createSettingsRouter(settingsModule.controllers);
