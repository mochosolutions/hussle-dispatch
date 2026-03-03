import type { Request, Response, NextFunction } from 'express';
import { requireRole } from '../auth';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors';

const makeMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    headers: {},
    cookies: {},
    ...overrides,
  }) as unknown as Request;

const makeMockResponse = (): Response => ({}) as Response;

const makeMockNext = (): jest.MockedFunction<NextFunction> => jest.fn();

describe('requireRole', () => {
  const makeAuthedRequest = (role = 'dispatcher'): Request => {
    const req = makeMockRequest();
    req.user = {
      userId: 'user-1',
      organizationId: 'org-1',
      orgSlug: 'test-org',
      membershipId: 'mem-1',
      role,
      refreshTokenHash: '',
      permissionsVersion: 1,
      sessionId: 'sess-1',
    };
    return req;
  };

  it('calls next when user has an allowed role', () => {
    const req = makeAuthedRequest('admin');
    const next = makeMockNext();

    requireRole(['admin'])(req, makeMockResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next when user has one of multiple allowed roles', () => {
    const req = makeAuthedRequest('dispatcher');
    const next = makeMockNext();

    requireRole(['admin', 'dispatcher'])(req, makeMockResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws ForbiddenError when user role is not in the allowed list', () => {
    const req = makeAuthedRequest('viewer');
    const next = makeMockNext();

    expect(() => requireRole(['admin'])(req, makeMockResponse(), next)).toThrow(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 status code on ForbiddenError', () => {
    const req = makeAuthedRequest('viewer');

    let caughtError: unknown;
    try {
      requireRole(['admin'])(req, makeMockResponse(), makeMockNext());
    } catch (error: unknown) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(ForbiddenError);
    expect((caughtError as ForbiddenError).statusCode).toBe(403);
  });

  it('throws UnauthorizedError when req.user is not set', () => {
    const req = makeMockRequest({ headers: {} });
    const next = makeMockNext();

    expect(() => requireRole(['admin'])(req, makeMockResponse(), next)).toThrow(UnauthorizedError);
  });

  it('allows access for all defined roles when all are permitted', () => {
    const allRoles = ['admin', 'dispatcher', 'viewer'];
    allRoles.forEach((role) => {
      const req = makeAuthedRequest(role);
      const next = makeMockNext();

      requireRole(allRoles)(req, makeMockResponse(), next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
