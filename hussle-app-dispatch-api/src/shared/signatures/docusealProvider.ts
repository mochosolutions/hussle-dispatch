/**
 * DocuSeal v1.x HTTP adapter.
 *
 * Endpoint paths and response shapes follow DocuSeal v1 API as of 2026-05.
 * Tests pin the expected shape — if DocuSeal API changes, update test fixtures
 * AND this adapter together. Confirm against https://www.docuseal.com/docs/api
 * before merging if it has been more than a few months since this was written.
 *
 * Retries on 5xx responses and network errors with bounded backoff (1s, 5s, 30s).
 * 4xx responses surface immediately as Error — bad request / auth issues should
 * not be retried.
 */

import type { Logger } from '@/shared/utils/logger';

import type { SignatureProviderPort } from './signatureProviderPort';
import type {
  CreateSubmissionInput,
  SignedArtifacts,
  SubmissionRef,
  SubmissionStatus,
} from './types';

const RETRY_DELAYS_MS = [1_000, 5_000, 30_000] as const;

// DocuSeal embed URLs default to ~24h TTL. Real value should be sourced from
// provider config in a future iteration; for now we recompute conservatively.
const EMBED_URL_LIFETIME_MS = 24 * 60 * 60 * 1000;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export interface DocusealProviderDeps {
  baseUrl: string;
  apiKey: string;
  logger: Logger;
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
}

interface DocuSealSubmitter {
  email: string;
  embed_src?: string;
}

interface DocuSealDocument {
  url: string;
}

interface DocuSealCreateResponse {
  id: string | number;
  submitters: DocuSealSubmitter[];
  expire_at: string;
}

interface DocuSealGetResponse {
  id: string | number;
  status: string;
  submitters: DocuSealSubmitter[];
  completed_at?: string;
  declined_at?: string;
  expired_at?: string;
  documents?: DocuSealDocument[];
  audit_log_url?: string;
}

export const createDocusealProvider = (deps: DocusealProviderDeps): SignatureProviderPort => {
  if (deps.baseUrl === '') {
    throw new Error('DocuSeal config missing: DOCUSEAL_BASE_URL or DOCUSEAL_API_KEY empty');
  }
  if (deps.apiKey === '') {
    throw new Error('DocuSeal config missing: DOCUSEAL_BASE_URL or DOCUSEAL_API_KEY empty');
  }

  const { baseUrl, apiKey, logger } = deps;
  const fetchImpl = deps.fetch ?? globalThis.fetch;
  const sleep = deps.sleep ?? defaultSleep;

  const callWithRetry = async <T>(op: string, request: () => Promise<Response>): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      let response: Response;
      try {
        response = await request();
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay === undefined) {
          break;
        }
        logger.warn('DocuSeal network error — retrying', { op, attempt });
        await sleep(delay);
        continue;
      }

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status >= 400 && response.status < 500) {
        throw new Error(`DocuSeal ${op} failed with status ${response.status}`);
      }

      lastError = new Error(`DocuSeal ${op} failed with status ${response.status}`);
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) {
        break;
      }
      logger.warn('DocuSeal 5xx — retrying', {
        op,
        status: response.status,
        attempt,
      });
      await sleep(delay);
    }

    throw lastError ?? new Error(`DocuSeal ${op} failed after retries`);
  };

  const buildHeaders = (extra?: Record<string, string>): Record<string, string> => ({
    'X-Auth-Token': apiKey,
    ...extra,
  });

  const createSubmission = async (input: CreateSubmissionInput): Promise<SubmissionRef> => {
    const html = input.metadata?.['html'];
    if (html === undefined || html === '') {
      throw new Error('DocuSeal createSubmission requires input.metadata.html');
    }

    const body = JSON.stringify({
      template_html: html,
      submitters: [
        {
          name: input.signer.name,
          email: input.signer.email,
          role: 'First Party',
        },
      ],
      metadata: input.metadata,
    });

    const response = await callWithRetry<DocuSealCreateResponse>('createSubmission', () =>
      fetchImpl(`${baseUrl}/api/submissions`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body,
      })
    );

    const firstSubmitter = response.submitters[0];
    if (firstSubmitter === undefined) {
      throw new Error('DocuSeal createSubmission returned no submitters');
    }
    if (firstSubmitter.embed_src === undefined) {
      throw new Error('DocuSeal createSubmission returned submitter without embed_src');
    }

    return {
      providerSubmissionId: String(response.id),
      embedUrl: firstSubmitter.embed_src,
      expiresAt: new Date(response.expire_at),
    };
  };

  const fetchSubmission = async (
    providerSubmissionId: string
  ): Promise<DocuSealGetResponse> =>
    callWithRetry<DocuSealGetResponse>('getSubmission', () =>
      fetchImpl(`${baseUrl}/api/submissions/${providerSubmissionId}`, {
        method: 'GET',
        headers: buildHeaders(),
      })
    );

  const getSubmission = async (providerSubmissionId: string): Promise<SubmissionStatus> => {
    const response = await fetchSubmission(providerSubmissionId);
    const id = String(response.id);

    if (response.status === 'pending') {
      return { status: 'pending', providerSubmissionId: id };
    }
    if (response.status === 'completed') {
      if (response.completed_at === undefined) {
        throw new Error('DocuSeal completed submission missing completed_at');
      }
      return {
        status: 'signed',
        providerSubmissionId: id,
        signedAt: new Date(response.completed_at),
      };
    }
    if (response.status === 'declined') {
      if (response.declined_at === undefined) {
        throw new Error('DocuSeal declined submission missing declined_at');
      }
      return {
        status: 'declined',
        providerSubmissionId: id,
        declinedAt: new Date(response.declined_at),
      };
    }
    if (response.status === 'expired') {
      if (response.expired_at === undefined) {
        throw new Error('DocuSeal expired submission missing expired_at');
      }
      return {
        status: 'expired',
        providerSubmissionId: id,
        expiredAt: new Date(response.expired_at),
      };
    }

    throw new Error(`DocuSeal getSubmission returned unknown status: ${response.status}`);
  };

  const voidSubmission = async (providerSubmissionId: string): Promise<void> => {
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}/api/submissions/${providerSubmissionId}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw error;
    }

    if (response.ok || response.status === 404) {
      return;
    }
    if (response.status >= 400 && response.status < 500) {
      throw new Error(`DocuSeal voidSubmission failed with status ${response.status}`);
    }
    throw new Error(`DocuSeal voidSubmission failed with status ${response.status}`);
  };

  const fetchSignedArtifacts = async (
    providerSubmissionId: string
  ): Promise<SignedArtifacts> => {
    const submission = await fetchSubmission(providerSubmissionId);

    const documents = submission.documents ?? [];
    const firstDoc = documents[0];
    if (firstDoc === undefined) {
      throw new Error('DocuSeal fetchSignedArtifacts: submission has no documents');
    }
    const docUrl = firstDoc.url;
    const auditUrl = submission.audit_log_url;
    if (auditUrl === undefined) {
      throw new Error('DocuSeal fetchSignedArtifacts: submission has no audit_log_url');
    }

    const [docResponse, auditResponse] = await Promise.all([
      fetchImpl(docUrl, { method: 'GET', headers: buildHeaders() }),
      fetchImpl(auditUrl, { method: 'GET', headers: buildHeaders() }),
    ]);

    if (!docResponse.ok) {
      throw new Error(`DocuSeal fetchSignedArtifacts: document fetch failed (${docResponse.status})`);
    }
    if (!auditResponse.ok) {
      throw new Error(
        `DocuSeal fetchSignedArtifacts: audit fetch failed (${auditResponse.status})`
      );
    }

    const signedPdf = Buffer.from(await docResponse.arrayBuffer());
    const auditCertificate = Buffer.from(await auditResponse.arrayBuffer());

    return { signedPdf, auditCertificate };
  };

  const refreshEmbedUrl = async (
    providerSubmissionId: string
  ): Promise<SubmissionRef> => {
    const response = await fetchSubmission(providerSubmissionId);
    const firstSubmitter = response.submitters[0];
    if (firstSubmitter === undefined) {
      throw new Error('DocuSeal refreshEmbedUrl returned no submitters');
    }
    if (firstSubmitter.embed_src === undefined) {
      throw new Error('DocuSeal refreshEmbedUrl returned submitter without embed_src');
    }
    return {
      providerSubmissionId: String(response.id),
      embedUrl: firstSubmitter.embed_src,
      expiresAt: new Date(Date.now() + EMBED_URL_LIFETIME_MS),
    };
  };

  return {
    createSubmission,
    getSubmission,
    voidSubmission,
    fetchSignedArtifacts,
    refreshEmbedUrl,
  };
};
