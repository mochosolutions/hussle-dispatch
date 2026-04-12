import type { Request, Response, NextFunction } from 'express';
import type { TrackingTokenRepoPort } from '@/notifications/types/trackingTokenTypes';
import type { TrackingTokenRecord } from '@/notifications/types/trackingTokenTypes';
import { createAuthenticateDriverToken } from '../authenticateDriverToken';

const makeMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    query: {},
    headers: {},
    ...overrides,
  }) as unknown as Request;

const makeMockResponse = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const makeMockNext = (): jest.MockedFunction<NextFunction> => jest.fn();

const makeTokenRecord = (overrides: Partial<TrackingTokenRecord> = {}): TrackingTokenRecord => ({
  id: 'token-1',
  loadId: 'load-1',
  vehicleId: null,
  driverId: null,
  token: 'valid-token-abc',
  type: 'DRIVER',
  expiresAt: new Date(Date.now() + 3600000),
  revokedAt: null,
  createdAt: new Date(),
  ...overrides,
});

const makeMockTokenRepo = (
  overrides: Partial<TrackingTokenRepoPort> = {},
): TrackingTokenRepoPort => ({
  create: jest.fn(),
  findByToken: jest.fn().mockResolvedValue(null),
  findActiveByLoadId: jest.fn(),
  revoke: jest.fn(),
  ...overrides,
});

describe('authenticateDriverToken', () => {
  it('returns 401 when no token provided', async () => {
    const tokenRepo = makeMockTokenRepo();
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest();
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ message: 'Missing driver portal token' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token not found in DB', async () => {
    const tokenRepo = makeMockTokenRepo({
      findByToken: jest.fn().mockResolvedValue(null),
    });
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest({ query: { token: 'nonexistent-token' } as never });
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ message: 'Invalid driver portal token' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token type is CUSTOMER', async () => {
    const record = makeTokenRecord({ type: 'CUSTOMER' });
    const tokenRepo = makeMockTokenRepo({
      findByToken: jest.fn().mockResolvedValue(record),
    });
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest({ query: { token: 'some-token' } as never });
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ message: 'Invalid driver portal token' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is revoked', async () => {
    const record = makeTokenRecord({ revokedAt: new Date('2026-01-01') });
    const tokenRepo = makeMockTokenRepo({
      findByToken: jest.fn().mockResolvedValue(record),
    });
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest({ query: { token: 'revoked-token' } as never });
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ message: 'Driver portal link has been revoked' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', async () => {
    const record = makeTokenRecord({ expiresAt: new Date('2020-01-01') });
    const tokenRepo = makeMockTokenRepo({
      findByToken: jest.fn().mockResolvedValue(record),
    });
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest({ query: { token: 'expired-token' } as never });
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ message: 'Driver portal link has expired' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.driverPortal and calls next on valid DRIVER token', async () => {
    const record = makeTokenRecord();
    const tokenRepo = makeMockTokenRepo({
      findByToken: jest.fn().mockResolvedValue(record),
    });
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest({ query: { token: 'valid-token-abc' } as never });
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(req.driverPortal).toEqual({
      loadId: 'load-1',
      tokenId: 'token-1',
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('reads token from query param', async () => {
    const record = makeTokenRecord();
    const findByToken = jest.fn().mockResolvedValue(record);
    const tokenRepo = makeMockTokenRepo({ findByToken });
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest({ query: { token: 'query-token' } as never });
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(findByToken).toHaveBeenCalledWith('query-token');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('reads token from Authorization Bearer header', async () => {
    const record = makeTokenRecord();
    const findByToken = jest.fn().mockResolvedValue(record);
    const tokenRepo = makeMockTokenRepo({ findByToken });
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest({
      headers: { authorization: 'Bearer header-token' },
    });
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(findByToken).toHaveBeenCalledWith('header-token');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('prefers query param over Authorization header', async () => {
    const record = makeTokenRecord();
    const findByToken = jest.fn().mockResolvedValue(record);
    const tokenRepo = makeMockTokenRepo({ findByToken });
    const middleware = createAuthenticateDriverToken({ tokenRepo });
    const req = makeMockRequest({
      query: { token: 'query-wins' } as never,
      headers: { authorization: 'Bearer header-loses' },
    });
    const res = makeMockResponse();
    const next = makeMockNext();

    await middleware(req, res, next);

    expect(findByToken).toHaveBeenCalledWith('query-wins');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
