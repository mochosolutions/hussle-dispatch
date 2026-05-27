import { env } from '@/config/env';
import { sharedEventBus } from '@/shared/messaging';
import { redisClient } from '@/shared/redisClient';
import { logger } from '@/shared/utils/logger';

import { createFmcsaModule } from './compositionRoot';
import type { FmcsaService } from './types';

const fmcsaModule = createFmcsaModule({
  eventBus: sharedEventBus,
  logger,
  redis: redisClient,
  providerKind: env.FMCSA_PROVIDER,
});

export const fmcsaService: FmcsaService = fmcsaModule.service;

export type {
  FmcsaIdentifier,
  FmcsaLookupOpts,
  FmcsaLookupResult,
  FmcsaService,
  FmcsaSnapshot,
} from './types';
