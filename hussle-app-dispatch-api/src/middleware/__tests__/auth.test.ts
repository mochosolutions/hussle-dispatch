import type { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../auth';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Creates a base64-encoded placeholder token matching the format expected
 * by the placeholder decoder in auth.ts.
 */
const makeToken = (overrides: Record<string, string> = {}): string => {
  const payload = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'DISPATCHER',
    organizationId: 'org-1',
    orgSlug: 'test-org',
    ...overrides,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const makeMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    headers: {},
    ...overrides,
  }) as unknown as Request;

const makeMockResponse = (): Response => ({}) as Response;

const makeMockNext = (): jest.MockedFunction<NextFunction> => jest.fn();

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

describe('requireAuth', () => {
  it('injects user, organizationId, and orgSlug when token is valid', () => {
    const token = makeToken();
    const req = makeMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const next = makeMockNext();

    requireAuth(req, makeMockResponse(), next);

    expect(req.user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      role: 'DISPATCHER',
    });
    expect(req.organizationId).toBe('org-1');
    expect(req.orgSlug).toBe('test-org');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws UnauthorizedError when Authorization header is absent', () => {
    const req = makeMockRequest({ headers: {} });
    const next = makeMockNext();

    expect(() => requireAuth(req, makeMockResponse(), next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when Authorization header has no Bearer scheme', () => {
    const req = makeMockRequest({
      headers: { authorization: 'Basic sometoken' },
    });

    expect(() => requireAuth(req, makeMockResponse(), makeMockNext())).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when Bearer token is missing after scheme', () => {
    const req = makeMockRequest({
      headers: { authorization: 'Bearer' },
    });

    expect(() => requireAuth(req, makeMockResponse(), makeMockNext())).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when token payload is not valid JSON', () => {
    const req = makeMockRequest({
      headers: { authorization: 'Bearer notbase64json' },
    });

    expect(() => requireAuth(req, makeMockResponse(), makeMockNext())).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when token is missing required fields', () => {
    const incomplete = Buffer.from(JSON.stringify({ id: 'user-1' })).toString('base64');
    const req = makeMockRequest({
      headers: { authorization: `Bearer ${incomplete}` },
    });

    expect(() => requireAuth(req, makeMockResponse(), makeMockNext())).toThrow(UnauthorizedError);
  });

  it('returns 401 status code on UnauthorizedError', () => {
    const req = makeMockRequest({ headers: {} });

    let caughtError: unknown;
    try {
      requireAuth(req, makeMockResponse(), makeMockNext());
    } catch (error: unknown) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(UnauthorizedError);
    expect((caughtError as UnauthorizedError).statusCode).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------

describe('requireRole', () => {
  const makeAuthedRequest = (role = 'DISPATCHER'): Request => {
    const token = makeToken({ role });
    const req = makeMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const next = makeMockNext();
    requireAuth(req, makeMockResponse(), next);
    return req;
  };

  it('calls next when user has an allowed role', () => {
    const req = makeAuthedRequest('ADMIN');
    const next = makeMockNext();

    requireRole(['ADMIN'])(req, makeMockResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next when user has one of multiple allowed roles', () => {
    const req = makeAuthedRequest('DISPATCHER');
    const next = makeMockNext();

    requireRole(['ADMIN', 'DISPATCHER'])(req, makeMockResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws ForbiddenError when user role is not in the allowed list', () => {
    const req = makeAuthedRequest('VIEWER');
    const next = makeMockNext();

    expect(() => requireRole(['ADMIN'])(req, makeMockResponse(), next)).toThrow(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 status code on ForbiddenError', () => {
    const req = makeAuthedRequest('VIEWER');

    let caughtError: unknown;
    try {
      requireRole(['ADMIN'])(req, makeMockResponse(), makeMockNext());
    } catch (error: unknown) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(ForbiddenError);
    expect((caughtError as ForbiddenError).statusCode).toBe(403);
  });

  it('throws UnauthorizedError when req.user is not set', () => {
    const req = makeMockRequest({ headers: {} });
    const next = makeMockNext();

    expect(() => requireRole(['ADMIN'])(req, makeMockResponse(), next)).toThrow(UnauthorizedError);
  });

  it('allows access for all defined roles when all are permitted', () => {
    for (const role of ['ADMIN', 'DISPATCHER', 'VIEWER'] as const) {
      const req = makeAuthedRequest(role);
      const next = makeMockNext();

      requireRole(['ADMIN', 'DISPATCHER', 'VIEWER'])(req, makeMockResponse(), next);

      expect(next).toHaveBeenCalledTimes(1);
    }
  });
});
