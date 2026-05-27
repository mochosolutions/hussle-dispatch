/**
 * Deterministic mock signature provider.
 *
 * Mirrors the FMCSA mock provider pattern (see `src/shared/fmcsa/mockFmcsaProvider.ts`).
 * Closes over an internal state map so create -> get -> void -> fetch can round-trip
 * within a single process. Reserved input values via `signer.email` trigger configured
 * failure modes so downstream services can be exercised against the discriminated-union
 * contract without hitting a real provider.
 *
 * Returns an intersection of the production port plus a `__testHelpers` namespace
 * (`markSigned`, `reset`) so tests can drive state transitions deterministically. The
 * port surface remains clean for production consumers — only test code references
 * `__testHelpers`.
 */
import crypto from 'node:crypto';

import type { SignatureProviderPort } from './signatureProviderPort';
import type {
  CreateSubmissionInput,
  SignedArtifacts,
  SubmissionRef,
  SubmissionStatus,
} from './types';

interface MockSubmissionState {
  input: CreateSubmissionInput;
  status: 'pending' | 'signed' | 'voided';
  createdAt: Date;
  signedAt?: Date;
  voidedAt?: Date;
}

export interface MockSignatureProviderTestHelpers {
  markSigned(providerSubmissionId: string): void;
  reset(): void;
}

export type MockSignatureProvider = SignatureProviderPort & {
  __testHelpers: MockSignatureProviderTestHelpers;
};

const SUBMISSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

const computeProviderSubmissionId = (input: CreateSubmissionInput): string => {
  const digest = crypto
    .createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');
  return `mock_${digest.slice(0, 16)}`;
};

export const createMockSignatureProvider = (): MockSignatureProvider => {
  const submissions = new Map<string, MockSubmissionState>();

  const createSubmission = async (input: CreateSubmissionInput): Promise<SubmissionRef> => {
    if (input.signer.email.includes('TIMEOUT@')) {
      throw new Error('Mock provider: timeout');
    }
    if (input.signer.email.includes('RATELIMIT@')) {
      throw new Error('Mock provider: rate_limit');
    }

    const providerSubmissionId = computeProviderSubmissionId(input);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + SUBMISSION_LIFETIME_MS);

    submissions.set(providerSubmissionId, {
      input,
      status: 'pending',
      createdAt,
    });

    return {
      providerSubmissionId,
      embedUrl: `/dev/sign/${providerSubmissionId}`,
      expiresAt,
    };
  };

  const getSubmission = async (providerSubmissionId: string): Promise<SubmissionStatus> => {
    if (providerSubmissionId === 'NOTFOUND') {
      throw new Error('Submission not found');
    }
    const state = submissions.get(providerSubmissionId);
    if (!state) {
      throw new Error('Submission not found');
    }

    if (state.input.signer.email.includes('DECLINE@')) {
      const declinedAt = state.signedAt ?? new Date();
      return { status: 'declined', providerSubmissionId, declinedAt };
    }

    if (state.status === 'signed') {
      const { signedAt } = state;
      if (signedAt === undefined) {
        throw new Error('Invariant: signed state missing signedAt');
      }
      return { status: 'signed', providerSubmissionId, signedAt };
    }

    if (state.status === 'voided') {
      const { voidedAt } = state;
      if (voidedAt === undefined) {
        throw new Error('Invariant: voided state missing voidedAt');
      }
      return { status: 'voided', providerSubmissionId, voidedAt };
    }

    return { status: 'pending', providerSubmissionId };
  };

  const voidSubmission = async (providerSubmissionId: string): Promise<void> => {
    const state = submissions.get(providerSubmissionId);
    if (!state) {
      throw new Error('Submission not found');
    }
    state.status = 'voided';
    state.voidedAt = new Date();
  };

  const fetchSignedArtifacts = async (
    providerSubmissionId: string
  ): Promise<SignedArtifacts> => {
    const state = submissions.get(providerSubmissionId);
    if (!state) {
      throw new Error('Submission not found');
    }
    return {
      signedPdf: Buffer.from('MOCK_SIGNED_PDF'),
      auditCertificate: Buffer.from('MOCK_AUDIT_CERT'),
    };
  };

  const refreshEmbedUrl = async (
    providerSubmissionId: string
  ): Promise<SubmissionRef> => {
    const state = submissions.get(providerSubmissionId);
    if (!state) {
      throw new Error('Submission not found');
    }
    const expiresAt = new Date(Date.now() + SUBMISSION_LIFETIME_MS);
    return {
      providerSubmissionId,
      embedUrl: `/dev/sign/${providerSubmissionId}`,
      expiresAt,
    };
  };

  const testHelpers: MockSignatureProviderTestHelpers = {
    markSigned: (providerSubmissionId) => {
      const state = submissions.get(providerSubmissionId);
      if (!state) {
        throw new Error('Submission not found');
      }
      state.status = 'signed';
      state.signedAt = new Date();
    },
    reset: () => {
      submissions.clear();
    },
  };

  return {
    createSubmission,
    getSubmission,
    voidSubmission,
    fetchSignedArtifacts,
    refreshEmbedUrl,
    __testHelpers: testHelpers,
  };
};
