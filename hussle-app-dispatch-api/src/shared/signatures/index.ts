import { env } from '@/config/env';
import { sharedEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';

import { createSignatureModule } from './compositionRoot';
import type { SignatureModule } from './compositionRoot';
import type { SignatureProviderPort } from './signatureProviderPort';
import type { SignatureService } from './types';

let cached: SignatureModule | null = null;

const init = (): SignatureModule => {
  if (!cached) {
    cached = createSignatureModule({
      env: {
        SIGNATURE_PROVIDER: env.SIGNATURE_PROVIDER,
        DOCUSEAL_BASE_URL: env.DOCUSEAL_BASE_URL,
        DOCUSEAL_API_KEY: env.DOCUSEAL_API_KEY,
        DOCUSEAL_DISPATCH_TEMPLATE_ID: env.DOCUSEAL_DISPATCH_TEMPLATE_ID,
        DOCUSEAL_SUBMITTER_ROLE: env.DOCUSEAL_SUBMITTER_ROLE,
      },
      eventBus: sharedEventBus,
      logger,
    });
  }
  return cached;
};

export const getSignatureService = (): SignatureService => init().service;
export const getSignatureProvider = (): SignatureProviderPort => init().provider;

export type {
  AgreementTemplateKey,
  CreateSubmissionInput,
  SignatureService,
  SignatureServiceOpts,
  SignedArtifacts,
  SubmissionRef,
  SubmissionStatus,
} from './types';
export type { SignatureProviderPort } from './signatureProviderPort';
