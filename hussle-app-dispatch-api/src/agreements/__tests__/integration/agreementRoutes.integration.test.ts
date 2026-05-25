import http from 'http';

import express from 'express';
import 'express-async-errors';
import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedUser } from '@/middleware/auth';
import { errorHandler } from '@/shared/middleware/errorHandler';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { SignatureService } from '@/shared/signatures/types';
import type { StorageProvider } from '@/shared/storage';
import type { Logger } from '@/shared/utils/logger';

import { AgreementAlreadyPendingError, AgreementNotVoidableError } from '../../errors/agreementErrors';
import { getAgreementController } from '../../controllers/getAgreementController';
import { listAgreementsController } from '../../controllers/listAgreementsController';
import { requestAgreementController } from '../../controllers/requestAgreementController';
import { voidAgreementController } from '../../controllers/voidAgreementController';
import type { OrganizationQueryPort } from '../../queries/organizationQueries';
import { createAgreementsRouter } from '../../routes/agreementRoutes';
import type {
  RequestAgreementInput,
} from '../../services/requestAgreement';
import type { VoidAgreementInput } from '../../services/voidAgreement';
import type { AgreementRepoPort } from '../../types/agreementRepoPort';
import type { AgreementServiceResult } from '../../types/agreementServiceResult';
import type { Agreement } from '../../types/agreementTypes';

// ---------------------------------------------------------------------------
// Auth mock — replace requireAuth/requireRole so tests can drive auth state.
// ---------------------------------------------------------------------------

let currentUser: AuthenticatedUser | null = null;

jest.mock('@/middleware/auth', () => {
  const actual = jest.requireActual('@/middleware/auth');
  return {
    ...actual,
    requireAuth: (req: Request, res: Response, next: NextFunction): void => {
      if (currentUser === null) {
        res.status(401).json({ errors: [{ message: 'Authentication required' }] });
        return;
      }
      req.user = currentUser;
      req.organizationId = currentUser.organizationId;
      next();
    },
    requireRole:
      (allowed: string[]) =>
      (req: Request, res: Response, next: NextFunction): void => {
        if (req.user === undefined || !allowed.includes(req.user.role)) {
          res.status(403).json({
            errors: [{ message: `Access denied. Required roles: ${allowed.join(', ')}` }],
          });
          return;
        }
        next();
      },
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FetchResult {
  status: number;
  body: unknown;
}

const buildUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  userId: 'user-1',
  email: 'user@example.com',
  organizationId: 'org-1',
  orgSlug: 'org',
  orgStatus: 'ACTIVE',
  membershipId: 'mem-1',
  role: 'dispatcher',
  refreshTokenHash: 'hash',
  permissionsVersion: 1,
  sessionId: 'sess-1',
  ...overrides,
});

const FIXED_NOW = new Date('2026-05-14T12:00:00.000Z');

const buildAgreement = (overrides: Partial<Agreement> = {}): Agreement =>
  ({
    id: 'ag-1',
    organizationId: 'org-1',
    carrierId: 'car-1',
    templateKey: 'DISPATCH_AGREEMENT',
    providerName: 'MOCK',
    providerSubmissionId: 'sub_abc',
    embedUrl: 'https://example.com/embed/sub_abc',
    embedUrlExpiresAt: new Date('2026-12-31T00:00:00.000Z'),
    signerName: 'Alice',
    signerEmail: 'alice@example.com',
    variables: {},
    status: 'PENDING',
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

const buildSignatureService = (): jest.Mocked<SignatureService> => ({
  createSubmission: jest.fn(),
  getSubmission: jest.fn(),
  voidSubmission: jest.fn(),
  fetchSignedArtifacts: jest.fn(),
  refreshEmbedUrl: jest.fn(),
});

const buildStorage = (): jest.Mocked<StorageProvider> => ({
  put: jest.fn(),
  get: jest.fn(),
  getFile: jest.fn(),
  getPresignedPutUrl: jest.fn(),
  getPresignedGetUrl: jest.fn().mockResolvedValue('https://presigned/url'),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  deleteByPrefix: jest.fn(),
  list: jest.fn(),
  exists: jest.fn(),
  getMetadata: jest.fn(),
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

const buildOrgQueries = (): jest.Mocked<OrganizationQueryPort> => ({
  findOrgNameById: jest.fn().mockResolvedValue('Test Org'),
});

interface WiredDeps {
  repo: jest.Mocked<AgreementRepoPort>;
  signatureService: jest.Mocked<SignatureService>;
  storage: jest.Mocked<StorageProvider>;
  eventBus: jest.Mocked<EventBus>;
  logger: jest.Mocked<Logger>;
  orgQueries: jest.Mocked<OrganizationQueryPort>;
  requestAgreement: jest.Mock<
    Promise<AgreementServiceResult<Agreement>>,
    [RequestAgreementInput]
  >;
  voidAgreement: jest.Mock<
    Promise<AgreementServiceResult<Agreement>>,
    [VoidAgreementInput]
  >;
}

const startApp = async (
  deps: WiredDeps,
  opts?: { now?: () => Date },
): Promise<{ url: string; close: () => Promise<void> }> => {
  const app = express();
  app.use(express.json());

  const controllers = {
    request: requestAgreementController({
      requestAgreement: deps.requestAgreement,
      orgQueries: deps.orgQueries,
      eventBus: deps.eventBus,
      storage: deps.storage,
      logger: deps.logger,
    }),
    list: listAgreementsController({
      agreementRepo: deps.repo,
      storage: deps.storage,
    }),
    get: getAgreementController({
      agreementRepo: deps.repo,
      signatureService: deps.signatureService,
      storage: deps.storage,
      logger: deps.logger,
      ...(opts?.now !== undefined ? { now: opts.now } : {}),
    }),
    void: voidAgreementController({
      voidAgreement: deps.voidAgreement,
      eventBus: deps.eventBus,
      storage: deps.storage,
      logger: deps.logger,
    }),
  };

  app.use('/api/v1/agreements', createAgreementsRouter(controllers));
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
  method: string;
  path: string;
  body?: unknown;
}

const sendRequest = async (options: SendOptions): Promise<FetchResult> =>
  new Promise((resolve, reject) => {
    const { baseUrl, method, path, body } = options;
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload !== undefined && {
            'Content-Length': Buffer.byteLength(payload).toString(),
          }),
        },
      },
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
    if (payload !== undefined) {
      req.write(payload);
    }
    req.end();
  });

const buildDeps = (): WiredDeps => ({
  repo: buildRepo(),
  signatureService: buildSignatureService(),
  storage: buildStorage(),
  eventBus: buildEventBus(),
  logger: buildLogger(),
  orgQueries: buildOrgQueries(),
  requestAgreement: jest.fn<
    Promise<AgreementServiceResult<Agreement>>,
    [RequestAgreementInput]
  >(),
  voidAgreement: jest.fn<
    Promise<AgreementServiceResult<Agreement>>,
    [VoidAgreementInput]
  >(),
});

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('POST /api/v1/agreements', () => {
  const validBody = {
    carrierId: '550e8400-e29b-41d4-a716-446655440000',
    templateKey: 'DISPATCH_AGREEMENT',
  };

  it('returns 201 with agreement (PENDING + embedUrl) when input is valid and dispatcher is authed', async () => {
    const deps = buildDeps();
    const created = buildAgreement();
    deps.requestAgreement.mockResolvedValue({
      data: created,
      events: [
        {
          type: 'agreement.generated',
          occurredAt: FIXED_NOW,
          payload: {
            agreementId: created.id,
            organizationId: created.organizationId,
            carrierId: created.carrierId,
            templateKey: 'DISPATCH_AGREEMENT',
            providerSubmissionId: 'sub_abc',
            correlationId: 'corr-1',
          },
        },
      ],
    });
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'POST', path: '/api/v1/agreements', body: validBody });

      expect(res.status).toBe(201);
      const body = res.body as { data: { id: string; status: string; embedUrl: string } };
      expect(body.data.id).toBe('ag-1');
      expect(body.data.status).toBe('PENDING');
      expect(body.data.embedUrl).toBe('https://example.com/embed/sub_abc');
      expect(deps.orgQueries.findOrgNameById).toHaveBeenCalledWith('org-1');
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'agreement.generated',
        expect.objectContaining({ agreementId: 'ag-1' }),
      );
    } finally {
      await close();
    }
  });

  it('returns 409 with code AGREEMENT_ALREADY_PENDING when service throws AgreementAlreadyPendingError', async () => {
    const deps = buildDeps();
    deps.requestAgreement.mockRejectedValue(new AgreementAlreadyPendingError());
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'POST', path: '/api/v1/agreements', body: validBody });

      expect(res.status).toBe(409);
      const body = res.body as { errors: { message: string }[] };
      expect(body.errors[0]?.message).toMatch(/already has a PENDING agreement/);
    } finally {
      await close();
    }
  });

  it('returns 401 when unauthenticated', async () => {
    const deps = buildDeps();
    const { url, close } = await startApp(deps);
    currentUser = null;

    try {
      const res = await sendRequest({ baseUrl: url, method: 'POST', path: '/api/v1/agreements', body: validBody });
      expect(res.status).toBe(401);
      expect(deps.requestAgreement).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 403 when user role is VIEWER', async () => {
    const deps = buildDeps();
    const { url, close } = await startApp(deps);
    currentUser = buildUser({ role: 'viewer' });

    try {
      const res = await sendRequest({ baseUrl: url, method: 'POST', path: '/api/v1/agreements', body: validBody });
      expect(res.status).toBe(403);
      expect(deps.requestAgreement).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 400 when carrierId is missing', async () => {
    const deps = buildDeps();
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: '/api/v1/agreements',
        body: { templateKey: 'DISPATCH_AGREEMENT' },
      });
      expect(res.status).toBe(400);
      expect(deps.requestAgreement).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });
});

describe('GET /api/v1/agreements/:id', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000';

  it('returns 200 with the agreement when present in caller org', async () => {
    const deps = buildDeps();
    deps.repo.findById.mockResolvedValue(buildAgreement({ id }));
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'GET', path: `/api/v1/agreements/${id}` });
      expect(res.status).toBe(200);
      const body = res.body as { data: { id: string; status: string } };
      expect(body.data.id).toBe(id);
      expect(body.data.status).toBe('PENDING');
    } finally {
      await close();
    }
  });

  it('returns 403 when agreement belongs to a different org', async () => {
    const deps = buildDeps();
    deps.repo.findById.mockResolvedValue(buildAgreement({ id, organizationId: 'other-org' }));
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'GET', path: `/api/v1/agreements/${id}` });
      expect(res.status).toBe(403);
    } finally {
      await close();
    }
  });

  it('returns 404 when no agreement exists', async () => {
    const deps = buildDeps();
    deps.repo.findById.mockResolvedValue(null);
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'GET', path: `/api/v1/agreements/${id}` });
      expect(res.status).toBe(404);
    } finally {
      await close();
    }
  });

  it('transparently refreshes embedUrl when expiresAt is in the past for PENDING', async () => {
    const deps = buildDeps();
    const stale = buildAgreement({
      id,
      status: 'PENDING',
      embedUrl: 'https://stale/embed',
      embedUrlExpiresAt: new Date('2020-01-01T00:00:00.000Z'),
      providerSubmissionId: 'sub_abc',
    });
    deps.repo.findById.mockResolvedValue(stale);
    deps.signatureService.refreshEmbedUrl.mockResolvedValue({
      providerSubmissionId: 'sub_abc',
      embedUrl: 'https://fresh/embed',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });
    const refreshedRow = buildAgreement({
      id,
      status: 'PENDING',
      embedUrl: 'https://fresh/embed',
      embedUrlExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
      providerSubmissionId: 'sub_abc',
    });
    deps.repo.update.mockResolvedValue(refreshedRow);

    const { url, close } = await startApp(deps, { now: () => FIXED_NOW });
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'GET', path: `/api/v1/agreements/${id}` });
      expect(res.status).toBe(200);
      const body = res.body as { data: { embedUrl: string; embedUrlExpiresAt: string } };
      expect(body.data.embedUrl).toBe('https://fresh/embed');
      expect(body.data.embedUrlExpiresAt).toBe('2030-01-01T00:00:00.000Z');
      expect(deps.signatureService.refreshEmbedUrl).toHaveBeenCalledWith('sub_abc');
      expect(deps.repo.update).toHaveBeenCalledWith(id, {
        embedUrl: 'https://fresh/embed',
        embedUrlExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
      });
    } finally {
      await close();
    }
  });

  it('does NOT refresh embed url when status is SIGNED', async () => {
    const deps = buildDeps();
    deps.repo.findById.mockResolvedValue(
      buildAgreement({
        id,
        status: 'SIGNED',
        signedPdfS3Key: 'org-1/agreements/ag-1/signed.pdf',
        auditCertificateS3Key: 'org-1/agreements/ag-1/audit.pdf',
        signedPdfSha256: 'abc',
        signedAt: FIXED_NOW,
        embedUrlExpiresAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    );
    const { url, close } = await startApp(deps, { now: () => FIXED_NOW });
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'GET', path: `/api/v1/agreements/${id}` });
      expect(res.status).toBe(200);
      expect(deps.signatureService.refreshEmbedUrl).not.toHaveBeenCalled();
      const body = res.body as {
        data: {
          status: string;
          artifacts: { signedPdfUrl: string; auditCertificateUrl: string; signedPdfSha256: string; signedAt: string };
        };
      };
      expect(body.data.status).toBe('SIGNED');
      expect(body.data.artifacts.signedPdfUrl).toBe('https://presigned/url');
      expect(body.data.artifacts.auditCertificateUrl).toBe('https://presigned/url');
      expect(body.data.artifacts.signedPdfSha256).toBe('abc');
      expect(deps.storage.getPresignedGetUrl).toHaveBeenCalledTimes(2);
      expect(deps.storage.getPresignedGetUrl).toHaveBeenCalledWith(
        'org-1/agreements/ag-1/signed.pdf',
        15 * 60,
      );
    } finally {
      await close();
    }
  });
});

describe('GET /api/v1/agreements (list)', () => {
  it('returns 200 with paginated data', async () => {
    const deps = buildDeps();
    deps.repo.findManyByOrg.mockResolvedValue({
      data: [buildAgreement({ id: 'ag-1' }), buildAgreement({ id: 'ag-2' })],
      total: 2,
    });
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'GET', path: '/api/v1/agreements?page=1&limit=20' });
      expect(res.status).toBe(200);
      const body = res.body as {
        data: { id: string }[];
        pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
      };
      expect(body.data).toHaveLength(2);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      });
    } finally {
      await close();
    }
  });

  it('passes filter params (carrierId, status) into the repo query', async () => {
    const deps = buildDeps();
    deps.repo.findManyByOrg.mockResolvedValue({ data: [], total: 0 });
    const { url, close } = await startApp(deps);
    currentUser = buildUser();
    const carrierId = '550e8400-e29b-41d4-a716-446655440000';

    try {
      const res = await sendRequest({
        baseUrl: url,
        method: 'GET',
        path: `/api/v1/agreements?carrierId=${carrierId}&status=PENDING`,
      });
      expect(res.status).toBe(200);
      const body = res.body as { data: unknown[]; pagination: { total: number } };
      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
      expect(deps.repo.findManyByOrg).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          carrierId,
          status: 'PENDING',
        }),
      );
    } finally {
      await close();
    }
  });
});

describe('POST /api/v1/agreements/:id/void', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000';

  it('returns 200 with VOIDED agreement when service succeeds', async () => {
    const deps = buildDeps();
    deps.voidAgreement.mockResolvedValue({
      data: buildAgreement({
        id,
        status: 'VOIDED',
        voidedAt: FIXED_NOW,
        voidedByUserId: 'user-1',
        voidReason: 'no longer needed',
      }),
      events: [
        {
          type: 'agreement.voided',
          occurredAt: FIXED_NOW,
          payload: {
            agreementId: id,
            organizationId: 'org-1',
            carrierId: 'car-1',
            voidedAt: FIXED_NOW.toISOString(),
            voidReason: 'no longer needed',
            voidedByUserId: 'user-1',
          },
        },
      ],
    });
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: `/api/v1/agreements/${id}/void`,
        body: { reason: 'no longer needed' },
      });
      expect(res.status).toBe(200);
      const body = res.body as { data: { id: string; status: string; voidReason: string } };
      expect(body.data.id).toBe(id);
      expect(body.data.status).toBe('VOIDED');
      expect(body.data.voidReason).toBe('no longer needed');
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'agreement.voided',
        expect.objectContaining({ agreementId: id }),
      );
    } finally {
      await close();
    }
  });

  it('returns 409 with AGREEMENT_NOT_VOIDABLE when service throws AgreementNotVoidableError', async () => {
    const deps = buildDeps();
    deps.voidAgreement.mockRejectedValue(new AgreementNotVoidableError('SIGNED'));
    const { url, close } = await startApp(deps);
    currentUser = buildUser();

    try {
      const res = await sendRequest({ baseUrl: url, method: 'POST', path: `/api/v1/agreements/${id}/void`, body: {} });
      expect(res.status).toBe(409);
      const body = res.body as { errors: { message: string }[] };
      expect(body.errors[0]?.message).toMatch(/cannot be voided from status SIGNED/);
    } finally {
      await close();
    }
  });
});
