import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import { createFmcsaService } from './fmcsaService';
import type { FmcsaPort } from './fmcsaPort';
import { createMockFmcsaProvider } from './mockFmcsaProvider';
import { createRedisCacheAdapter } from './redisCacheAdapter';
import type { RedisLike } from './redisCacheAdapter';
import { createSaferWebApiProvider } from './saferWebApiProvider';
import type { FmcsaService } from './types';

export type FmcsaProviderKind = 'mock' | 'safer-web';

interface FmcsaModuleDeps {
  eventBus: EventBus;
  logger: Logger;
  redis: RedisLike;
  providerKind: FmcsaProviderKind;
}

export interface FmcsaModuleExports {
  service: FmcsaService;
}

const selectProvider = (kind: FmcsaProviderKind): FmcsaPort => {
  switch (kind) {
    case 'mock':
      return createMockFmcsaProvider();
    case 'safer-web':
      return createSaferWebApiProvider();
  }
};

export const createFmcsaModule = (deps: FmcsaModuleDeps): FmcsaModuleExports => {
  const provider = selectProvider(deps.providerKind);
  const cache = createRedisCacheAdapter({ redis: deps.redis, logger: deps.logger });
  const service = createFmcsaService({
    provider,
    cache,
    eventBus: deps.eventBus,
    logger: deps.logger,
  });
  return { service };
};
