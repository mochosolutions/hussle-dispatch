import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import { createDocusealProvider } from './docusealProvider';
import { createMockSignatureProvider } from './mockSignatureProvider';
import type { SignatureProviderPort } from './signatureProviderPort';
import { createSignatureService } from './signatureService';
import type { SignatureService } from './types';

export type SignatureProviderKind = 'mock' | 'docuseal';

export interface SignatureModuleDeps {
  env: {
    SIGNATURE_PROVIDER: SignatureProviderKind;
    DOCUSEAL_BASE_URL: string;
    DOCUSEAL_API_KEY: string;
    DOCUSEAL_DISPATCH_TEMPLATE_ID: number;
  };
  eventBus: EventBus;
  logger: Logger;
}

export interface SignatureModule {
  service: SignatureService;
  provider: SignatureProviderPort;
}

const selectProvider = (deps: SignatureModuleDeps): SignatureProviderPort => {
  switch (deps.env.SIGNATURE_PROVIDER) {
    case 'mock':
      return createMockSignatureProvider();
    case 'docuseal':
      return createDocusealProvider({
        baseUrl: deps.env.DOCUSEAL_BASE_URL,
        apiKey: deps.env.DOCUSEAL_API_KEY,
        templateId: deps.env.DOCUSEAL_DISPATCH_TEMPLATE_ID,
        logger: deps.logger,
      });
    default: {
      const exhaust: never = deps.env.SIGNATURE_PROVIDER;
      throw new Error(`Unknown SIGNATURE_PROVIDER: ${String(exhaust)}`);
    }
  }
};

export const createSignatureModule = (deps: SignatureModuleDeps): SignatureModule => {
  const provider = selectProvider(deps);
  const service = createSignatureService({
    provider,
    eventBus: deps.eventBus,
    logger: deps.logger,
  });
  return { service, provider };
};
