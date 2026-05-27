import type { PrismaClient } from '@prisma/client';
import { settingsRepositoryPrisma } from './repositories/settingsRepositoryPrisma';
import { createSettingsService } from './services/settingsService';
import { createSettingsControllers } from './controllers/settingsController';
import type { SettingsControllers } from './controllers/settingsController';

interface SettingsModuleDeps {
  prismaClient: PrismaClient;
}

export const createSettingsModule = ({
  prismaClient,
}: SettingsModuleDeps): {
  controllers: SettingsControllers;
} => {
  const settingsRepository = settingsRepositoryPrisma(prismaClient);

  const settingsService = createSettingsService({
    settingsRepository,
  });

  const controllers = createSettingsControllers({
    settingsService,
  });

  return { controllers };
};
