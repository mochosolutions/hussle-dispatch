import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '@/shared/errors/commonErrors';
import { csrfProtection } from '../csrfProtection';

interface BuildReqInput {
  method?: string;
  path?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}

const buildReq = (input: BuildReqInput = {}): Request =>
  ({
    method: input.method ?? 'GET',
    path: input.path ?? '/api/v1/carriers',
    cookies: input.cookies ?? {},
    headers: input.headers ?? {},
  }) as unknown as Request;

const buildRes = () => {
  const cookies: { name: string; value: string }[] = [];
  return {
    cookie: jest.fn((name: string, value: string) => {
      cookies.push({ name, value });
    }),
    cookies,
  } as unknown as Response & { cookies: { name: string; value: string }[] };
};

describe('csrfProtection middleware', () => {
  it('skips validation entirely on exempt public auth paths', () => {
    const req = buildReq({ method: 'POST', path: '/api/v1/auth/login' });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('skips validation when there is no accessToken cookie (Bearer/API-key)', () => {
    const req = buildReq({ method: 'POST', path: '/api/v1/load-board/ingest' });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('lazily issues a csrfToken cookie on safe-method authenticated requests without one', () => {
    const req = buildReq({
      method: 'GET',
      path: '/api/v1/carriers',
      cookies: { accessToken: 'jwt-here' },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    csrfProtection(req, res, next);

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect((res.cookie as jest.Mock).mock.calls[0][0]).toBe('csrfToken');
    const issued = (res.cookie as jest.Mock).mock.calls[0][1] as string;
    expect(issued.length).toBeGreaterThan(20);
    expect(next).toHaveBeenCalledWith();
  });

  it('does not re-issue when a csrfToken cookie is already present', () => {
    const req = buildReq({
      method: 'GET',
      path: '/api/v1/carriers',
      cookies: { accessToken: 'jwt-here', csrfToken: 'existing-token' },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    csrfProtection(req, res, next);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('accepts a mutating request whose X-CSRF-Token header matches the cookie', () => {
    const req = buildReq({
      method: 'POST',
      path: '/api/v1/carriers',
      cookies: { accessToken: 'jwt-here', csrfToken: 'token-abc' },
      headers: { 'x-csrf-token': 'token-abc' },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a mutating request when the header is missing', () => {
    const req = buildReq({
      method: 'POST',
      path: '/api/v1/carriers',
      cookies: { accessToken: 'jwt-here', csrfToken: 'token-abc' },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    expect(() => csrfProtection(req, res, next)).toThrow(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a mutating request when the header does not match the cookie', () => {
    const req = buildReq({
      method: 'POST',
      path: '/api/v1/carriers',
      cookies: { accessToken: 'jwt-here', csrfToken: 'token-abc' },
      headers: { 'x-csrf-token': 'token-different' },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    expect(() => csrfProtection(req, res, next)).toThrow(ForbiddenError);
  });

  it('rejects a mutating request when the cookie is missing but the header is present', () => {
    const req = buildReq({
      method: 'POST',
      path: '/api/v1/carriers',
      cookies: { accessToken: 'jwt-here' },
      headers: { 'x-csrf-token': 'spoofed-token' },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    expect(() => csrfProtection(req, res, next)).toThrow(ForbiddenError);
  });

  it('still skips when path is exempt even if a header is present', () => {
    const req = buildReq({
      method: 'POST',
      path: '/api/v1/auth/token/refresh',
      cookies: { accessToken: 'jwt-here' },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
