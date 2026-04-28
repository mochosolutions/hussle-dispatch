import type { Request, Response } from 'express';
import type { TrackingTokenService } from '@/notifications/services/trackingTokenService';
import type {
  DriverPortalLoadQueryPort,
  DriverPortalLoadSummary,
} from '../../types/driverPortalTypes';
import type { Logger } from '@/shared/utils/logger';
import { ValidationError } from '@/shared/errors';
import { createGetDriverPortalLinkController } from '../getDriverPortalLinkController';

const makeLoadSummary = (
  overrides: Partial<DriverPortalLoadSummary> = {},
): DriverPortalLoadSummary => ({
  id: 'load-1',
  organizationId: 'org-1',
  loadNumber: 'LD-1',
  status: 'DISPATCHED',
  equipmentType: null,
  driverInstructions: null,
  stops: [],
  driver: null,
  ...overrides,
});

const makeLogger = (): Logger => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}) as unknown as Logger;

const makeReq = (loadId = 'load-1'): Request<{ loadId: string }> =>
  ({ params: { loadId } }) as unknown as Request<{ loadId: string }>;

const makeRes = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

describe('getDriverPortalLinkController', () => {
  let loadQuery: jest.Mocked<DriverPortalLoadQueryPort>;
  let trackingTokenService: jest.Mocked<TrackingTokenService>;

  beforeEach(() => {
    loadQuery = {
      findLoadForDriverPortal: jest.fn(),
      findDriverPhoneByLoadId: jest.fn(),
    };
    trackingTokenService = {
      getOrCreate: jest.fn(),
      getOrCreateDriverToken: jest.fn(),
      getTrackingSummary: jest.fn(),
      revoke: jest.fn(),
    } as jest.Mocked<TrackingTokenService>;
  });

  it('returns the portal URL when load is dispatched', async () => {
    loadQuery.findLoadForDriverPortal.mockResolvedValue(makeLoadSummary());
    trackingTokenService.getOrCreateDriverToken.mockResolvedValue({
      id: 'tok-1',
      loadId: 'load-1',
      token: 'abc-123',
      type: 'DRIVER',
      vehicleId: null,
      driverId: null,
      expiresAt: new Date(Date.now() + 3600_000),
      revokedAt: null,
      createdAt: new Date(),
    });

    const controller = createGetDriverPortalLinkController({
      loadQuery,
      trackingTokenService,
      logger: makeLogger(),
      trackingBaseUrl: 'https://app.example.com',
    });

    const req = makeReq();
    const res = makeRes();

    await controller(req, res);

    expect(trackingTokenService.getOrCreateDriverToken).toHaveBeenCalledWith('load-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: { url: 'https://app.example.com/driver-portal/abc-123' },
    });
  });

  it('throws ValidationError when load does not exist', async () => {
    loadQuery.findLoadForDriverPortal.mockResolvedValue(null);

    const controller = createGetDriverPortalLinkController({
      loadQuery,
      trackingTokenService,
      logger: makeLogger(),
      trackingBaseUrl: 'https://app.example.com',
    });

    await expect(controller(makeReq(), makeRes())).rejects.toThrow(ValidationError);
    expect(trackingTokenService.getOrCreateDriverToken).not.toHaveBeenCalled();
  });

  it('throws ValidationError when load status is pre-dispatch', async () => {
    loadQuery.findLoadForDriverPortal.mockResolvedValue(
      makeLoadSummary({ status: 'AWAITING_DISPATCH' }),
    );

    const controller = createGetDriverPortalLinkController({
      loadQuery,
      trackingTokenService,
      logger: makeLogger(),
      trackingBaseUrl: 'https://app.example.com',
    });

    await expect(controller(makeReq(), makeRes())).rejects.toThrow(ValidationError);
    expect(trackingTokenService.getOrCreateDriverToken).not.toHaveBeenCalled();
  });
});
