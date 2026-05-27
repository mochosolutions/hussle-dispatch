import crypto from 'node:crypto';
import http from 'node:http';

import express from 'express';
import 'express-async-errors';

import { errorHandler } from '@/shared/middleware/errorHandler';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import { docusealWebhookController } from '../../webhooks/docusealWebhookController';
import { createDocusealWebhookRouter } from '../../webhooks/docusealWebhookRoutes';
import { createVerifyDocusealHmac } from '../../webhooks/verifyDocusealHmacMiddleware';
import type { AgreementRepoPort } from '../../types/agreementRepoPort';
import type { Agreement, AgreementStatus } from '../../types/agreementTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECRET = 'test-webhook-secret';
const FIXED_NOW = new Date('2026-05-14T12:00:00.000Z');

const signBytes = (bytes: Buffer): string =>
  crypto.createHmac('sha256', SECRET).update(bytes).digest('hex');

const buildAgreement = (overrides: Partial<Agreement> = {}): Agreement =>
  ({
    id: 'ag-1',
    organizationId: 'org-1',
    carrierId: 'car-1',
    templateKey: 'DISPATCH_AGREEMENT',
    providerName: 'DOCUSEAL',
    providerSubmissionId: 'sub_abc',
    embedUrl: 'https://example.com/embed/sub_abc',
    embedUrlExpiresAt: new Date('2026-12-31T00:00:00.000Z'),
    signerName: 'Alice',
    signerEmail: 'alice@example.com',
    variables: {},
    status: 'PENDING' as AgreementStatus,
    createdByUserId: 'user-1',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    signedAt: null,
    declinedAt: null,
    expiredAt: null,
    voidedAt: null,
    voidedByUserId: null,
    voidReason: null,
    signedPdfS3Key: null,
    auditCertificateS3Key: null,
    signedPdfSha256: null,
    ...overrides,
  }) as Agreement;

const buildRepo = (): jest.Mocked<AgreementRepoPort> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByProviderSubmissionId: jest.fn(),
  findManyByOrg: jest.fn(),
  findLatestForCarrier: jest.fn(),
  update: jest.fn(),
  findStaleInProgress: jest.fn(),
  countActivePending: jest.fn(),
  findManySigned: jest.fn(),
});

const buildEventBus = (): jest.Mocked<EventBus> => ({
  publish: jest.fn().mockResolvedValue(undefined),
  publishDelayed: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

const buildLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

interface WiredDeps {
  repo: jest.Mocked<AgreementRepoPort>;
  eventBus: jest.Mocked<EventBus>;
  logger: jest.Mocked<Logger>;
}

const buildDeps = (): WiredDeps => ({
  repo: buildRepo(),
  eventBus: buildEventBus(),
  logger: buildLogger(),
});

const startApp = async (
  deps: WiredDeps,
  opts?: { now?: () => Date },
): Promise<{ url: string; close: () => Promise<void> }> => {
  const app = express();

  const verifyHmac = createVerifyDocusealHmac({
    secret: SECRET,
    logger: deps.logger,
  });
  const controller = docusealWebhookController({
    agreementRepo: deps.repo,
    eventBus: deps.eventBus,
    logger: deps.logger,
    ...(opts?.now !== undefined ? { now: opts.now } : {}),
  });

  app.use('/webhooks', createDocusealWebhookRouter({ controller, verifyHmac }));
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Failed to start test server');
  }
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
};

interface SendOptions {
  baseUrl: string;
  rawBytes: Buffer;
  signature?: string;
  contentType?: string;
}

interface FetchResult {
  status: number;
  body: unknown;
}

const sendWebhook = async (options: SendOptions): Promise<FetchResult> =>
  new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      'Content-Type': options.contentType ?? 'application/json',
      'Content-Length': options.rawBytes.length.toString(),
    };
    if (options.signature !== undefined) {
      headers['X-Docuseal-Signature'] = options.signature;
    }
    const req = http.request(
      `${options.baseUrl}/webhooks/docuseal`,
      { method: 'POST', headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed: unknown;
          try {
            parsed = raw.length > 0 ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.write(options.rawBytes);
    req.end();
  });

const buildBodyBytes = (body: object): Buffer => Buffer.from(JSON.stringify(body));

const buildSignedRequest = (body: object): { rawBytes: Buffer; signature: string } => {
  const rawBytes = buildBodyBytes(body);
  return { rawBytes, signature: signBytes(rawBytes) };
};

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('POST /webhooks/docuseal', () => {
  it('returns 200 and emits agreement.signed for form.completed on PENDING agreement', async () => {
    const deps = buildDeps();
    deps.repo.findByProviderSubmissionId.mockResolvedValue(
      buildAgreement({ status: 'PENDING' }),
    );
    const { url, close } = await startApp(deps, { now: () => FIXED_NOW });
    const body = { event_type: 'form.completed', data: { submission_id: 'sub_abc' } };
    const { rawBytes, signature } = buildSignedRequest(body);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(deps.eventBus.publish).toHaveBeenCalledTimes(1);
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'agreement.signed',
        expect.objectContaining({
          agreementId: 'ag-1',
          organizationId: 'org-1',
          carrierId: 'car-1',
          providerSubmissionId: 'sub_abc',
          signedAt: FIXED_NOW.toISOString(),
        }),
      );
      expect(deps.repo.update).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 401 when HMAC is invalid (signed with wrong secret)', async () => {
    const deps = buildDeps();
    const { url, close } = await startApp(deps);
    const body = { event_type: 'form.completed', data: { submission_id: 'sub_abc' } };
    const rawBytes = buildBodyBytes(body);
    const wrongSig = crypto.createHmac('sha256', 'WRONG_SECRET').update(rawBytes).digest('hex');

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature: wrongSig });

      expect(res.status).toBe(401);
      expect(deps.repo.findByProviderSubmissionId).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 401 when X-Docuseal-Signature header is missing', async () => {
    const deps = buildDeps();
    const { url, close } = await startApp(deps);
    const body = { event_type: 'form.completed', data: { submission_id: 'sub_abc' } };
    const rawBytes = buildBodyBytes(body);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes });

      expect(res.status).toBe(401);
      expect(deps.repo.findByProviderSubmissionId).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 401 when body is tampered (signature for body A, send body B)', async () => {
    const deps = buildDeps();
    const { url, close } = await startApp(deps);
    const bodyA = { event_type: 'form.completed', data: { submission_id: 'sub_a' } };
    const bodyB = { event_type: 'form.completed', data: { submission_id: 'sub_b' } };
    const sigForA = signBytes(buildBodyBytes(bodyA));

    try {
      const res = await sendWebhook({
        baseUrl: url,
        rawBytes: buildBodyBytes(bodyB),
        signature: sigForA,
      });

      expect(res.status).toBe(401);
      expect(deps.repo.findByProviderSubmissionId).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 200 with replayed:true when agreement already SIGNED and form.completed arrives', async () => {
    const deps = buildDeps();
    deps.repo.findByProviderSubmissionId.mockResolvedValue(
      buildAgreement({ status: 'SIGNED' }),
    );
    const { url, close } = await startApp(deps);
    const body = { event_type: 'form.completed', data: { submission_id: 'sub_abc' } };
    const { rawBytes, signature } = buildSignedRequest(body);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true, replayed: true });
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
      expect(deps.repo.update).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 200, persists DECLINED, and emits agreement.declined for form.declined', async () => {
    const deps = buildDeps();
    deps.repo.findByProviderSubmissionId.mockResolvedValue(
      buildAgreement({ status: 'PENDING' }),
    );
    deps.repo.update.mockResolvedValue(
      buildAgreement({ status: 'DECLINED', declinedAt: FIXED_NOW }),
    );
    const { url, close } = await startApp(deps, { now: () => FIXED_NOW });
    const body = { event_type: 'form.declined', data: { submission_id: 'sub_abc' } };
    const { rawBytes, signature } = buildSignedRequest(body);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'agreement.declined',
        expect.objectContaining({
          agreementId: 'ag-1',
          providerSubmissionId: 'sub_abc',
          declinedAt: FIXED_NOW.toISOString(),
        }),
      );
      expect(deps.repo.update).toHaveBeenCalledWith('ag-1', {
        status: 'DECLINED',
        declinedAt: FIXED_NOW,
      });
    } finally {
      await close();
    }
  });

  it('returns 200, persists EXPIRED, and emits agreement.expired for form.expired', async () => {
    const deps = buildDeps();
    deps.repo.findByProviderSubmissionId.mockResolvedValue(
      buildAgreement({ status: 'PENDING' }),
    );
    deps.repo.update.mockResolvedValue(
      buildAgreement({ status: 'EXPIRED', expiredAt: FIXED_NOW }),
    );
    const { url, close } = await startApp(deps, { now: () => FIXED_NOW });
    const body = { event_type: 'form.expired', data: { submission_id: 'sub_abc' } };
    const { rawBytes, signature } = buildSignedRequest(body);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'agreement.expired',
        expect.objectContaining({
          agreementId: 'ag-1',
          providerSubmissionId: 'sub_abc',
          expiredAt: FIXED_NOW.toISOString(),
        }),
      );
      expect(deps.repo.update).toHaveBeenCalledWith('ag-1', {
        status: 'EXPIRED',
        expiredAt: FIXED_NOW,
      });
    } finally {
      await close();
    }
  });

  it('returns 200 received with no state change for form.viewed', async () => {
    const deps = buildDeps();
    deps.repo.findByProviderSubmissionId.mockResolvedValue(
      buildAgreement({ status: 'PENDING' }),
    );
    const { url, close } = await startApp(deps);
    const body = { event_type: 'form.viewed', data: { submission_id: 'sub_abc' } };
    const { rawBytes, signature } = buildSignedRequest(body);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
      expect(deps.repo.update).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 200 received for unknown event_type with no event published', async () => {
    const deps = buildDeps();
    deps.repo.findByProviderSubmissionId.mockResolvedValue(
      buildAgreement({ status: 'PENDING' }),
    );
    const { url, close } = await startApp(deps);
    const body = { event_type: 'form.something_else', data: { submission_id: 'sub_abc' } };
    const { rawBytes, signature } = buildSignedRequest(body);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
      expect(deps.repo.update).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 404 when submission_id has no matching agreement', async () => {
    const deps = buildDeps();
    deps.repo.findByProviderSubmissionId.mockResolvedValue(null);
    const { url, close } = await startApp(deps);
    const body = { event_type: 'form.completed', data: { submission_id: 'sub_missing' } };
    const { rawBytes, signature } = buildSignedRequest(body);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature });

      expect(res.status).toBe(404);
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 400 when body bytes are malformed JSON despite a valid signature', async () => {
    const deps = buildDeps();
    const { url, close } = await startApp(deps);
    const rawBytes = Buffer.from('not json');
    const signature = signBytes(rawBytes);

    try {
      const res = await sendWebhook({ baseUrl: url, rawBytes, signature });

      expect(res.status).toBe(400);
      expect(deps.repo.findByProviderSubmissionId).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });
});
