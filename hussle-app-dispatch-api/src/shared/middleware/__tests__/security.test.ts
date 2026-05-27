// Required env vars must be set before any module imports `@/config/env`.
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'test-jwt-secret';
process.env['REFRESH_SECRET'] = process.env['REFRESH_SECRET'] ?? 'test-refresh-secret';
process.env['DATABASE_URL'] =
  process.env['DATABASE_URL'] ?? 'postgresql://test:test@localhost:5432/test';

import http from 'http';
import express from 'express';
import { configureSecurity } from '../security';

interface FetchResult {
  status: number;
  headers: Record<string, string>;
}

const optionsRequest = (
  baseUrl: string,
  path: string,
  origin: string,
): Promise<FetchResult> =>
  new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'GET',
        },
      },
      (res) => {
        const headers: Record<string, string> = {};
        Object.entries(res.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value;
          } else if (Array.isArray(value)) {
            headers[key] = value.join(',');
          }
        });
        res.on('data', (_chunk: unknown) => {
          // Consume response body — required to prevent stream backpressure
        });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, headers });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });

interface StartedApp {
  url: string;
  close: () => Promise<void>;
}

const startApp = async (): Promise<StartedApp> => {
  const app = express();
  configureSecurity(app);
  app.get('/ping', (_req, res) => {
    res.json({ ok: true });
  });

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
        server.close((err) => (err !== undefined && err !== null ? reject(err) : resolve()));
      }),
  };
};

describe('configureSecurity CORS', () => {
  const originalAllowOrigins = process.env.ALLOW_ORIGINS;
  const originalExtensionIds = process.env.ALLOWED_EXTENSION_IDS;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.ALLOW_ORIGINS = originalAllowOrigins;
    process.env.ALLOWED_EXTENSION_IDS = originalExtensionIds;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('rejects chrome-extension origin when ALLOWED_EXTENSION_IDS is empty', async () => {
    process.env.ALLOW_ORIGINS = 'http://localhost:5173';
    process.env.ALLOWED_EXTENSION_IDS = '';
    const app = await startApp();
    try {
      const res = await optionsRequest(app.url, '/ping', 'chrome-extension://abc123');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('allows chrome-extension origin when its ID is in ALLOWED_EXTENSION_IDS', async () => {
    process.env.ALLOW_ORIGINS = 'http://localhost:5173';
    process.env.ALLOWED_EXTENSION_IDS = 'abc123,def456';
    const app = await startApp();
    try {
      const res = await optionsRequest(app.url, '/ping', 'chrome-extension://abc123');
      expect(res.headers['access-control-allow-origin']).toBe('chrome-extension://abc123');
    } finally {
      await app.close();
    }
  });

  it('rejects chrome-extension origin whose ID is not in ALLOWED_EXTENSION_IDS', async () => {
    process.env.ALLOW_ORIGINS = 'http://localhost:5173';
    process.env.ALLOWED_EXTENSION_IDS = 'abc123';
    const app = await startApp();
    try {
      const res = await optionsRequest(app.url, '/ping', 'chrome-extension://other999');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('allows configured regular origins', async () => {
    process.env.ALLOW_ORIGINS = 'http://localhost:5173';
    process.env.ALLOWED_EXTENSION_IDS = '';
    const app = await startApp();
    try {
      const res = await optionsRequest(app.url, '/ping', 'http://localhost:5173');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    } finally {
      await app.close();
    }
  });
});
