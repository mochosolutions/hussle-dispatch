import express from 'express';
import 'express-async-errors';
import http from 'http';
import { errorHandler } from '@/shared/middleware/errorHandler';
import { requireRole } from '@/middleware/auth';
import type { AuthenticatedUser as AuthPayload } from '@/middleware/auth';
import type { DocumentControllers } from '../../controllers/documentController';

interface FetchResult {
  status: number;
  body: unknown;
}

/**
 * Test harness — mounts the archive route with a fake auth middleware that
 * injects req.user, the real requireRole(['ADMIN']) middleware, and a stub
 * controller. Verifies that requireRole correctly gates the endpoint by role.
 */
const startApp = async (
  user: AuthPayload | null,
  archiveController: express.RequestHandler,
): Promise<{ url: string; close: () => Promise<void> }> => {
  const app = express();
  app.use(express.json());

  // Fake auth — injects req.user from the test
  app.use((req, _res, next) => {
    if (user !== null) {
      req.user = user;
    }
    next();
  });

  const router = express.Router();
  router.patch('/:id/archive', requireRole(['ADMIN']), archiveController);
  app.use('/documents', router);

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

const sendPatch = async (baseUrl: string, path: string): Promise<FetchResult> =>
  new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}${path}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let body: unknown;
          try {
            body = raw.length > 0 ? JSON.parse(raw) : null;
          } catch {
            body = raw;
          }
          resolve({ status: res.statusCode ?? 0, body });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });

const buildUser = (overrides: Partial<AuthPayload> = {}): AuthPayload => ({
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
}) as AuthPayload;

type ArchiveController = DocumentControllers['archive'];

describe('PATCH /documents/:id/archive — ADMIN gating', () => {
  const stubArchiveController: ArchiveController = (_req, res) => {
    res.status(200).json({ data: { ok: true } });
  };

  it('returns 403 when caller is DISPATCHER', async () => {
    // Arrange
    const { url, close } = await startApp(
      buildUser({ role: 'DISPATCHER' }),
      stubArchiveController,
    );

    try {
      // Act
      const res = await sendPatch(url, '/documents/doc-1/archive');

      // Assert
      expect(res.status).toBe(403);
    } finally {
      await close();
    }
  });

  it('returns 200 when caller is ADMIN', async () => {
    // Arrange
    const { url, close } = await startApp(
      buildUser({ role: 'ADMIN' }),
      stubArchiveController,
    );

    try {
      // Act
      const res = await sendPatch(url, '/documents/doc-1/archive');

      // Assert
      expect(res.status).toBe(200);
    } finally {
      await close();
    }
  });

  it('returns 401 when caller is not authenticated', async () => {
    // Arrange
    const { url, close } = await startApp(null, stubArchiveController);

    try {
      // Act
      const res = await sendPatch(url, '/documents/doc-1/archive');

      // Assert
      expect(res.status).toBe(401);
    } finally {
      await close();
    }
  });
});
