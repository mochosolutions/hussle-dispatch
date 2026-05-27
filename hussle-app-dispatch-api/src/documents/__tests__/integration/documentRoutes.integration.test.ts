import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import 'express-async-errors';
import http from 'http';
import { errorHandler } from '@/shared/middleware/errorHandler';
import type { AuthenticatedUser } from '@/middleware/auth';
import { createDocumentControllers } from '../../controllers/documentController';
import { createBulkDownloadController } from '../../controllers/bulkDownloadController';
import { createDocumentRoutes } from '../../routes/documentRoutes';
import type { DocumentService } from '../../types/documentServiceTypes';
import {
  DocumentNotFoundError,
  DocumentUploadNotConfirmedError,
  DocumentAlreadyConfirmedError,
} from '../../types/documentErrors';

// ---------------------------------------------------------------------------
// Auth mock — replaces requireAuth with a stub that injects req.user from the
// module-level currentUser variable, so tests can drive authentication state.
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
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FetchResult {
  status: number;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface SendRequestOptions {
  baseUrl: string;
  method: string;
  path: string;
  body?: unknown;
}

const buildUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  userId: 'user-1',
  email: 'user@example.com',
  organizationId: 'org-1',
  orgSlug: 'org',
  orgStatus: 'ACTIVE',
  membershipId: 'mem-1',
  role: 'DISPATCHER',
  refreshTokenHash: 'hash',
  permissionsVersion: 1,
  sessionId: 'sess-1',
  ...overrides,
});

const buildService = (overrides: Partial<DocumentService> = {}): DocumentService => ({
  presign: jest.fn(),
  confirm: jest.fn(),
  list: jest.fn(),
  getById: jest.fn(),
  getDownloadUrl: jest.fn(),
  archive: jest.fn(),
  bulkDownload: jest.fn(),
  ...overrides,
});

const buildDocument = (overrides: Record<string, unknown> = {}) => ({
  id: 'doc-1',
  organizationId: 'org-1',
  entityType: 'load',
  entityId: '550e8400-e29b-41d4-a716-446655440000',
  type: 'BOL_SIGNED',
  fileName: 'bol.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  s3Key: 'org-1/loads/load-1/bol_signed/bol.pdf',
  url: 'https://example.com/presigned',
  uploadStatus: 'confirmed',
  isArchived: false,
  uploadedByUserId: 'user-1',
  uploadedByUser: { firstName: 'John', lastName: 'Doe' },
  expiresAt: null,
  metadata: null,
  notes: null,
  createdAt: new Date(),
  reviewStatus: 'pending_review',
  reviewedAt: null,
  reviewedByUserId: null,
  rejectionReason: null,
  signatureData: null,
  signedAt: null,
  ...overrides,
});

const startApp = async (
  service: DocumentService,
): Promise<{ url: string; close: () => Promise<void> }> => {
  const app = express();
  app.use(express.json());

  const baseControllers = createDocumentControllers({ documentService: service });
  const bulkDownloadController = createBulkDownloadController({ documentService: service });
  const controllers = { ...baseControllers, bulkDownload: bulkDownloadController };

  app.use('/documents', createDocumentRoutes(controllers));
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

const sendRequest = async (options: SendRequestOptions): Promise<FetchResult> =>
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
          resolve({ status: res.statusCode ?? 0, body: parsed, headers: res.headers });
        });
      },
    );
    req.on('error', reject);
    if (payload !== undefined) {
      req.write(payload);
    }
    req.end();
  });

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('POST /documents/presign', () => {
  const validBody = {
    fileName: 'bol.pdf',
    mimeType: 'application/pdf',
    type: 'BOL_SIGNED',
    entityType: 'load',
    entityId: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('returns 201 with presign result when input is valid', async () => {
    // Arrange
    const presignResult = {
      documentId: 'doc-1',
      presignedUrl: 'https://example.com/presigned',
      expiresIn: 900,
    };
    const service = buildService({ presign: jest.fn().mockResolvedValue(presignResult) });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({ baseUrl: url, method: 'POST', path: '/documents/presign', body: validBody });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ data: presignResult });
    } finally {
      await close();
    }
  });

  it('returns 401 when unauthenticated', async () => {
    // Arrange
    const service = buildService();
    const { url, close } = await startApp(service);
    currentUser = null;

    try {
      // Act
      const res = await sendRequest({ baseUrl: url, method: 'POST', path: '/documents/presign', body: validBody });

      // Assert
      expect(res.status).toBe(401);
    } finally {
      await close();
    }
  });

  it('returns 400 when mimeType is not in allowlist', async () => {
    // Arrange
    const service = buildService();
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: '/documents/presign',
        body: { ...validBody, mimeType: 'text/plain' },
      });

      // Assert
      expect(res.status).toBe(400);
      expect(service.presign).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('returns 400 when entityType is invalid', async () => {
    // Arrange
    const service = buildService();
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: '/documents/presign',
        body: { ...validBody, entityType: 'shipment' },
      });

      // Assert
      expect(res.status).toBe(400);
      expect(service.presign).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('accepts entityType=invoice (whitelisted for invoice-detail document attachments)', async () => {
    // Arrange
    const service = buildService();
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: '/documents/presign',
        body: { ...validBody, entityType: 'invoice' },
      });

      // Assert
      expect(res.status).toBe(201);
      expect(service.presign).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'invoice' }),
      );
    } finally {
      await close();
    }
  });

  it('returns 400 when entityId is not a UUID', async () => {
    // Arrange
    const service = buildService();
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: '/documents/presign',
        body: { ...validBody, entityId: 'not-a-uuid' },
      });

      // Assert
      expect(res.status).toBe(400);
      expect(service.presign).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('passes organizationId from auth context to service', async () => {
    // Arrange
    const presignResult = {
      documentId: 'doc-1',
      presignedUrl: 'https://example.com/presigned',
      expiresIn: 900,
    };
    const presignFn = jest.fn().mockResolvedValue(presignResult);
    const service = buildService({ presign: presignFn });
    const { url, close } = await startApp(service);
    currentUser = buildUser({ organizationId: 'org-1' });

    try {
      // Act
      await sendRequest({ baseUrl: url, method: 'POST', path: '/documents/presign', body: validBody });

      // Assert
      expect(presignFn).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' }),
      );
    } finally {
      await close();
    }
  });
});

describe('POST /documents/:id/confirm', () => {
  const docId = '550e8400-e29b-41d4-a716-446655440001';

  it('returns 200 with confirmed document', async () => {
    // Arrange
    const document = buildDocument({ id: docId });
    const service = buildService({ confirm: jest.fn().mockResolvedValue(document) });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: `/documents/${docId}/confirm`,
        body: {},
      });

      // Assert
      expect(res.status).toBe(200);
    } finally {
      await close();
    }
  });

  it('returns 422 when file does not exist in storage', async () => {
    // Arrange
    const service = buildService({
      confirm: jest.fn().mockRejectedValue(new DocumentUploadNotConfirmedError(docId)),
    });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: `/documents/${docId}/confirm`,
        body: {},
      });

      // Assert
      expect(res.status).toBe(422);
    } finally {
      await close();
    }
  });

  it('returns 409 when document is already confirmed', async () => {
    // Arrange
    const service = buildService({
      confirm: jest.fn().mockRejectedValue(new DocumentAlreadyConfirmedError(docId)),
    });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: `/documents/${docId}/confirm`,
        body: {},
      });

      // Assert
      expect(res.status).toBe(409);
    } finally {
      await close();
    }
  });

  it('returns 404 when document belongs to a different org', async () => {
    // Arrange
    const service = buildService({
      confirm: jest.fn().mockRejectedValue(new DocumentNotFoundError(docId)),
    });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: `/documents/${docId}/confirm`,
        body: {},
      });

      // Assert
      expect(res.status).toBe(404);
    } finally {
      await close();
    }
  });

  it('returns 401 when unauthenticated', async () => {
    // Arrange
    const service = buildService();
    const { url, close } = await startApp(service);
    currentUser = null;

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'POST',
        path: `/documents/${docId}/confirm`,
        body: {},
      });

      // Assert
      expect(res.status).toBe(401);
    } finally {
      await close();
    }
  });
});

describe('GET /documents/:id/download', () => {
  const docId = '550e8400-e29b-41d4-a716-446655440001';

  it('returns 302 redirect to presigned download URL when document is confirmed', async () => {
    // Arrange
    const downloadUrl = 'https://example.com/download';
    const service = buildService({ getDownloadUrl: jest.fn().mockResolvedValue(downloadUrl) });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      // Node http.request does not follow redirects by default — status 302 is received directly
      const res = await sendRequest({
        baseUrl: url,
        method: 'GET',
        path: `/documents/${docId}/download`,
      });

      // Assert
      expect(res.status).toBe(302);
      expect(typeof res.headers['location']).toBe('string');
      expect((res.headers['location'] as string).length).toBeGreaterThan(0);
    } finally {
      await close();
    }
  });

  it('returns 422 when document is not yet confirmed', async () => {
    // Arrange
    const service = buildService({
      getDownloadUrl: jest.fn().mockRejectedValue(new DocumentUploadNotConfirmedError(docId)),
    });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'GET',
        path: `/documents/${docId}/download`,
      });

      // Assert
      expect(res.status).toBe(422);
    } finally {
      await close();
    }
  });

  it('returns 404 when document is not found', async () => {
    // Arrange
    const service = buildService({
      getDownloadUrl: jest.fn().mockRejectedValue(new DocumentNotFoundError(docId)),
    });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'GET',
        path: `/documents/${docId}/download`,
      });

      // Assert
      expect(res.status).toBe(404);
    } finally {
      await close();
    }
  });

  it('returns 401 when unauthenticated', async () => {
    // Arrange
    const service = buildService();
    const { url, close } = await startApp(service);
    currentUser = null;

    try {
      // Act
      const res = await sendRequest({
        baseUrl: url,
        method: 'GET',
        path: `/documents/${docId}/download`,
      });

      // Assert
      expect(res.status).toBe(401);
    } finally {
      await close();
    }
  });
});

describe('GET /documents', () => {
  it('returns 200 with list of documents', async () => {
    // Arrange
    const documents = [buildDocument(), buildDocument({ id: 'doc-2' })];
    const service = buildService({ list: jest.fn().mockResolvedValue(documents) });
    const { url, close } = await startApp(service);
    currentUser = buildUser();

    try {
      // Act
      const res = await sendRequest({ baseUrl: url, method: 'GET', path: '/documents' });

      // Assert
      expect(res.status).toBe(200);
    } finally {
      await close();
    }
  });

  it('passes organizationId from auth context to service', async () => {
    // Arrange
    const listFn = jest.fn().mockResolvedValue([]);
    const service = buildService({ list: listFn });
    const { url, close } = await startApp(service);
    currentUser = buildUser({ organizationId: 'org-1' });

    try {
      // Act
      await sendRequest({ baseUrl: url, method: 'GET', path: '/documents' });

      // Assert
      expect(listFn).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' }),
      );
    } finally {
      await close();
    }
  });

  it('returns 401 when unauthenticated', async () => {
    // Arrange
    const service = buildService();
    const { url, close } = await startApp(service);
    currentUser = null;

    try {
      // Act
      const res = await sendRequest({ baseUrl: url, method: 'GET', path: '/documents' });

      // Assert
      expect(res.status).toBe(401);
    } finally {
      await close();
    }
  });
});
