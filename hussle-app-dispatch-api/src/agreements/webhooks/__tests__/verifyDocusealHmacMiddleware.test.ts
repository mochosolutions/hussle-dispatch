import crypto from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import type { Logger } from '@/shared/utils/logger';

import { createVerifyDocusealHmac } from '../verifyDocusealHmacMiddleware';

const SECRET = 'test-webhook-secret';

const buildLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

interface MockRes {
  statusCode: number | null;
  payload: unknown;
  status: jest.Mock;
  json: jest.Mock;
}

const buildRes = (): MockRes => {
  const res: MockRes = {
    statusCode: null,
    payload: null,
    status: jest.fn().mockImplementation(function (this: MockRes, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn().mockImplementation(function (this: MockRes, body: unknown) {
      this.payload = body;
      return this;
    }),
  };
  // Bind `this` so chained calls share state.
  res.status = res.status.bind(res);
  res.json = res.json.bind(res);
  return res;
};

const buildReq = (opts: {
  rawBody?: Buffer;
  signature?: string;
}): Request => {
  const headers: Record<string, string> = {};
  if (opts.signature !== undefined) {
    headers['x-docuseal-signature'] = opts.signature;
  }
  const req = {
    rawBody: opts.rawBody,
    body: undefined as unknown,
    header: (name: string): string | undefined => headers[name.toLowerCase()],
  };
  return req as unknown as Request;
};

const sign = (body: Buffer): string =>
  crypto.createHmac('sha256', SECRET).update(body).digest('hex');

describe('createVerifyDocusealHmac', () => {
  let logger: jest.Mocked<Logger>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    logger = buildLogger();
    next = jest.fn();
  });

  it('calls next when signature matches and body is valid JSON', () => {
    const middleware = createVerifyDocusealHmac({ secret: SECRET, logger });
    const rawBody = Buffer.from('{"event_type":"form.viewed","data":{"submission_id":"sub_1"}}');
    const req = buildReq({ rawBody, signature: sign(rawBody) });
    const res = buildRes();

    middleware(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
    expect((req as Request & { body: unknown }).body).toEqual({
      event_type: 'form.viewed',
      data: { submission_id: 'sub_1' },
    });
  });

  it('returns 401 when signature header is missing', () => {
    const middleware = createVerifyDocusealHmac({ secret: SECRET, logger });
    const rawBody = Buffer.from('{}');
    const req = buildReq({ rawBody });
    const res = buildRes();

    middleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ errors: [{ message: 'missing signature' }] });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when signature does not match (length mismatch path)', () => {
    const middleware = createVerifyDocusealHmac({ secret: SECRET, logger });
    const rawBody = Buffer.from('{"a":1}');
    const req = buildReq({ rawBody, signature: 'deadbeef' });
    const res = buildRes();

    middleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ errors: [{ message: 'invalid signature' }] });
    expect(logger.warn).toHaveBeenCalledWith('DocuSeal HMAC mismatch', { signature: 'deadbeef' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when signature is correct length but wrong bytes (timingSafeEqual path)', () => {
    const middleware = createVerifyDocusealHmac({ secret: SECRET, logger });
    const rawBody = Buffer.from('{"a":1}');
    // Generate a valid-length signature by signing different bytes.
    const wrongSig = sign(Buffer.from('different'));
    const req = buildReq({ rawBody, signature: wrongSig });
    const res = buildRes();

    middleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ errors: [{ message: 'invalid signature' }] });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when rawBody is missing', () => {
    const middleware = createVerifyDocusealHmac({ secret: SECRET, logger });
    const req = buildReq({ signature: 'aabb' });
    const res = buildRes();

    middleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(500);
    expect(res.payload).toEqual({ errors: [{ message: 'rawBody missing' }] });
    expect(logger.error).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when secret is empty', () => {
    const middleware = createVerifyDocusealHmac({ secret: '', logger });
    const req = buildReq({ rawBody: Buffer.from('{}'), signature: 'aabb' });
    const res = buildRes();

    middleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(500);
    expect(res.payload).toEqual({ errors: [{ message: 'webhook misconfigured' }] });
    expect(logger.error).toHaveBeenCalledWith('DocuSeal webhook secret not configured');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when body bytes are not valid JSON despite valid HMAC', () => {
    const middleware = createVerifyDocusealHmac({ secret: SECRET, logger });
    const rawBody = Buffer.from('not json');
    const req = buildReq({ rawBody, signature: sign(rawBody) });
    const res = buildRes();

    middleware(req, res as unknown as Response, next);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ errors: [{ message: 'invalid json' }] });
    expect(next).not.toHaveBeenCalled();
  });
});
