import express from 'express';
import 'express-async-errors';
import http from 'http';
import { errorHandler } from '@/shared/middleware/errorHandler';
import { createResolveSlugController } from '../../controllers/resolveSlugController';
import { createShortLinkRoutes } from '../../routes/shortLinkRoutes';
import type { ShortLinkService } from '../../services/shortLinkService';

interface FetchResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

const buildLogger = () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const startApp = async (
  service: ShortLinkService,
): Promise<{ url: string; close: () => Promise<void> }> => {
  const app = express();
  app.use(express.json());
  const controllers = {
    resolveSlug: createResolveSlugController({
      shortLinkService: service,
      logger: buildLogger(),
    }),
  };
  app.use('/s', createShortLinkRoutes(controllers));
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

const fetchPath = async (
  baseUrl: string,
  path: string,
): Promise<FetchResult> =>
  new Promise((resolve, reject) => {
    http
      .get(`${baseUrl}${path}`, (res) => {
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
          const headers: Record<string, string> = {};
          Object.entries(res.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
              headers[key] = value;
            } else if (Array.isArray(value)) {
              headers[key] = value.join(',');
            }
          });
          resolve({
            status: res.statusCode ?? 0,
            headers,
            body,
          });
        });
      })
      .on('error', reject);
  });

const buildService = (
  overrides: Partial<ShortLinkService> = {},
): ShortLinkService => ({
  createShortLink: jest.fn(),
  resolveSlug: jest.fn(),
  ...overrides,
});

describe('GET /s/:slug', () => {
  it('returns 302 with Location header for an active slug', async () => {
    const service = buildService({
      resolveSlug: jest
        .fn()
        .mockResolvedValue({ targetUrl: 'https://example.com/destination' }),
    });
    const { url, close } = await startApp(service);
    try {
      const res = await fetchPath(url, '/s/AbCd1234');

      expect(res.status).toBe(302);
      expect(res.headers['location']).toBe('https://example.com/destination');
    } finally {
      await close();
    }
  });

  it('returns 404 with JSON envelope when slug is not found', async () => {
    const service = buildService({
      resolveSlug: jest.fn().mockResolvedValue(null),
    });
    const { url, close } = await startApp(service);
    try {
      const res = await fetchPath(url, '/s/AbCd1234');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        errors: [{ message: 'Link not found or expired' }],
      });
    } finally {
      await close();
    }
  });

  it('returns 404 envelope when slug is expired (service returns null)', async () => {
    const service = buildService({
      resolveSlug: jest.fn().mockResolvedValue(null),
    });
    const { url, close } = await startApp(service);
    try {
      const res = await fetchPath(url, '/s/Expired1');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        errors: [{ message: 'Link not found or expired' }],
      });
    } finally {
      await close();
    }
  });

  it('returns 400 when slug is malformed (7 chars)', async () => {
    const service = buildService();
    const { url, close } = await startApp(service);
    try {
      const res = await fetchPath(url, '/s/Short77');

      expect(res.status).toBe(400);
      expect(service.resolveSlug).not.toHaveBeenCalled();
    } finally {
      await close();
    }
  });

  it('does not require an Authorization header', async () => {
    const service = buildService({
      resolveSlug: jest
        .fn()
        .mockResolvedValue({ targetUrl: 'https://example.com/x' }),
    });
    const { url, close } = await startApp(service);
    try {
      const res = await fetchPath(url, '/s/AbCd1234');

      expect(res.status).toBe(302);
    } finally {
      await close();
    }
  });
});
