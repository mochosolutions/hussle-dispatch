import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import http from 'http';
import type { AddressInfo } from 'net';
import { createSettlementRouter, type SettlementModuleControllers } from '../settlementRoutes';
import { isCustomError } from '../../../shared/errors';

// Replace requireAuth with a stub that sets req.user from a header so tests
// can drive the role without building a real JWT.
jest.mock('@/middleware/auth', () => {
  const actual = jest.requireActual('@/middleware/auth');
  return {
    ...actual,
    requireAuth: (req: Request, _res: Response, next: NextFunction): void => {
      const role = req.headers['x-test-role'];
      if (typeof role === 'string') {
        req.user = {
          userId: 'user-1',
          organizationId: 'org-1',
          orgSlug: 'test-org',
          orgStatus: 'ACTIVE',
          membershipId: 'mem-1',
          role,
          refreshTokenHash: '',
          permissionsVersion: 1,
          sessionId: 'sess-1',
        } as Request['user'];
      }
      next();
    },
  };
});

// Avoid running real validators.
jest.mock('@/shared/middleware/validateRequest', () => ({
  validateRequest: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const makeControllerStub = (): RequestHandler => (_req, res): void => {
  res.status(200).json({ ok: true });
};

const makeControllers = (): SettlementModuleControllers => ({
  settlement: {
    generate: makeControllerStub(),
    list: makeControllerStub(),
    getById: makeControllerStub(),
    approve: makeControllerStub(),
    pay: makeControllerStub(),
    dispute: makeControllerStub(),
    downloadPdf: makeControllerStub(),
    sendEmail: makeControllerStub(),
  } as unknown as SettlementModuleControllers['settlement'],
  adjustment: {
    addAdjustment: makeControllerStub(),
    updateAdjustment: makeControllerStub(),
    deleteAdjustment: makeControllerStub(),
  } as unknown as SettlementModuleControllers['adjustment'],
});

const startApp = async (): Promise<{ url: string; close: () => Promise<void> }> => {
  const app = express();
  app.use(express.json());
  app.use('/settlements', createSettlementRouter(makeControllers()));
  // Error handler — convert CustomError instances to their statusCode.
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (isCustomError(err)) {
      res.status(err.statusCode).json({ errors: err.serializeErrors() });
      return;
    }
    res.status(500).json({ errors: [{ message: err.message }] });
  });

  const server = await new Promise<http.Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${address.port}`;
  const close = (): Promise<void> =>
    new Promise((resolve) => {
      server.close(() => resolve());
    });
  return { url, close };
};

const postJson = (url: string, body: unknown, headers: Record<string, string>): Promise<{ status: number; body: unknown }> =>
  new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(data).toString(),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed: unknown = null;
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
    req.write(data);
    req.end();
  });

describe('settlementRoutes role gating', () => {
  let server: { url: string; close: () => Promise<void> };

  beforeAll(async () => {
    server = await startApp();
  });

  afterAll(async () => {
    await server.close();
  });

  it('returns 403 when viewer role hits POST /settlements/generate', async () => {
    const response = await postJson(
      `${server.url}/settlements/generate`,
      { driverId: 'drv-1' },
      { 'x-test-role': 'viewer' },
    );
    expect(response.status).toBe(403);
  });

  it('allows dispatcher role to hit POST /settlements/generate', async () => {
    const response = await postJson(
      `${server.url}/settlements/generate`,
      { driverId: 'drv-1' },
      { 'x-test-role': 'dispatcher' },
    );
    expect(response.status).toBe(200);
  });

  it('returns 403 when dispatcher hits PATCH /:id/approve (admin-only)', async () => {
    const data = JSON.stringify({});
    const response = await new Promise<{ status: number }>((resolve, reject) => {
      const req = http.request(
        `${server.url}/settlements/abc/approve`,
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(data).toString(),
            'x-test-role': 'dispatcher',
          },
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', () => resolve({ status: res.statusCode ?? 0 }));
        },
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
    expect(response.status).toBe(403);
  });
});
