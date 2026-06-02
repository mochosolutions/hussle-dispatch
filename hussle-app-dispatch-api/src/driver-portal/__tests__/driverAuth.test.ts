import { BadRequestError } from '@mocho/common';

import { ForbiddenError, GoneError, NotFoundError } from '@/shared/errors';
import { ROLES } from '@/config/roles';

import { inviteDriverService } from '../services/inviteDriverService';
import { acceptDriverInviteService } from '../services/acceptDriverInviteService';
import { createDriverPortalService } from '../services/driverPortalService';
import type { DriverAuthInfo } from '../types/driverAuthTypes';

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const driverWithContact: DriverAuthInfo = {
  id: 'driver-1',
  firstName: 'Dana',
  lastName: 'Driver',
  email: 'dana@example.com',
  phone: '+15551234567',
  userId: null,
  managedByOrgId: 'org-A',
};

// ---------------------------------------------------------------------------
// inviteDriverService
// ---------------------------------------------------------------------------

describe('inviteDriverService', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeDeps = (driver: DriverAuthInfo | null) => ({
    driverAuthRepo: {
      findDriverAuthInfo: jest.fn().mockResolvedValue(driver),
      findDriverIdByUserId: jest.fn(),
      linkUser: jest.fn(),
    },
    inviteTokenRepo: {
      create: jest.fn().mockResolvedValue({ id: 'tok-1' }),
      findByToken: jest.fn(),
      markAccepted: jest.fn(),
    },
    frontendUrl: 'http://localhost:5173',
    logger,
    eventBus: { publish: jest.fn().mockResolvedValue(undefined), publishDelayed: jest.fn(), subscribe: jest.fn(), isReady: jest.fn(), close: jest.fn() },
  });

  it('creates an invite token when the driver has a contact method', async () => {
    const deps = makeDeps(driverWithContact);

    const result = await inviteDriverService(
      { driverId: 'driver-1', organizationId: 'org-A', invitedByUserId: 'user-1' },
      deps,
    );

    expect(deps.inviteTokenRepo.create).toHaveBeenCalledTimes(1);
    expect(result.setupUrl).toContain('/driver-portal/setup/');
    // Publishes the delivery event so the notification subscriber sends the link.
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'driver.invited',
      expect.objectContaining({ driverId: 'driver-1', setupUrl: result.setupUrl }),
    );
  });

  it('throws a validation error when the driver has no contact method', async () => {
    const deps = makeDeps({ ...driverWithContact, email: null, phone: null });

    await expect(
      inviteDriverService(
        { driverId: 'driver-1', organizationId: 'org-A', invitedByUserId: 'user-1' },
        deps,
      ),
    ).rejects.toThrow(BadRequestError);
    expect(deps.inviteTokenRepo.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the driver belongs to a different org', async () => {
    const deps = makeDeps({ ...driverWithContact, managedByOrgId: 'org-OTHER' });

    await expect(
      inviteDriverService(
        { driverId: 'driver-1', organizationId: 'org-A', invitedByUserId: 'user-1' },
        deps,
      ),
    ).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// acceptDriverInviteService
// ---------------------------------------------------------------------------

describe('acceptDriverInviteService', () => {
  beforeEach(() => jest.clearAllMocks());

  const validToken = {
    id: 'tok-1',
    driverId: 'driver-1',
    organizationId: 'org-A',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    acceptedAt: null,
  };

  const makeDeps = (overrides: Partial<{ token: typeof validToken | null; driver: DriverAuthInfo | null }>) => {
    const authProvider = {
      createUser: jest.fn().mockResolvedValue({ id: 'ext-1' }),
      deleteUser: jest.fn().mockResolvedValue({ id: 'ext-1' }),
    };
    const linkDriverUser = jest.fn();
    const markTokenAccepted = jest.fn();
    const createMembership = jest.fn().mockResolvedValue({ membershipId: 'mem-1' });

    return {
      deps: {
        transactionManager: { runInTransaction: <T>(fn: (tx: unknown) => Promise<T>) => fn({}) },
        findTokenByToken: jest.fn().mockResolvedValue(overrides.token === undefined ? validToken : overrides.token),
        findDriverAuthInfo: jest.fn().mockResolvedValue(overrides.driver === undefined ? driverWithContact : overrides.driver),
        findOrganizationById: jest.fn().mockResolvedValue({ id: 'org-A', slug: 'org-a', status: 'ACTIVE', subscriptionTier: 'pro' }),
        authProvider,
        createUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
        createMembership,
        linkDriverUser,
        markTokenAccepted,
        logger,
      },
      authProvider,
      linkDriverUser,
      markTokenAccepted,
      createMembership,
    };
  };

  it('provisions a DRIVER membership, links the driver, and marks the token used', async () => {
    const { deps, linkDriverUser, markTokenAccepted, createMembership } = makeDeps({});

    const result = await acceptDriverInviteService({ token: 'tok', password: 'password123' }, deps);

    expect(createMembership).toHaveBeenCalledWith(
      expect.objectContaining({ role: ROLES.DRIVER, organizationId: 'org-A' }),
      expect.anything(),
    );
    expect(linkDriverUser).toHaveBeenCalledWith('driver-1', 'user-1', expect.anything());
    expect(markTokenAccepted).toHaveBeenCalledTimes(1);
    expect(result.role).toBe(ROLES.DRIVER);
    expect(result.driverId).toBe('driver-1');
  });

  it('rejects an expired token with GoneError', async () => {
    const { deps } = makeDeps({ token: { ...validToken, expiresAt: new Date(Date.now() - 1000) } });

    await expect(
      acceptDriverInviteService({ token: 'tok', password: 'password123' }, deps),
    ).rejects.toThrow(GoneError);
  });

  it('rejects a revoked token with GoneError', async () => {
    const { deps } = makeDeps({ token: { ...validToken, revokedAt: new Date() } });

    await expect(
      acceptDriverInviteService({ token: 'tok', password: 'password123' }, deps),
    ).rejects.toThrow(GoneError);
  });

  it('rejects an already-accepted token with GoneError', async () => {
    const { deps } = makeDeps({ token: { ...validToken, acceptedAt: new Date() } });

    await expect(
      acceptDriverInviteService({ token: 'tok', password: 'password123' }, deps),
    ).rejects.toThrow(GoneError);
  });

  it('cleans up the Cognito user when membership creation fails', async () => {
    const { deps, authProvider } = makeDeps({});
    deps.createMembership = jest.fn().mockRejectedValue(new Error('db down'));

    await expect(
      acceptDriverInviteService({ token: 'tok', password: 'password123' }, deps),
    ).rejects.toThrow();
    expect(authProvider.deleteUser).toHaveBeenCalledWith('ext-1');
  });
});

// ---------------------------------------------------------------------------
// driverPortalService — load ownership authorization
// ---------------------------------------------------------------------------

describe('driverPortalService authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeService = (loadDriverId: string | null) =>
    createDriverPortalService({
      loadQuery: {
        findDriverPhoneByLoadId: jest.fn(),
        findLoadForDriverPortal: jest.fn().mockResolvedValue({
          id: 'load-1',
          organizationId: 'org-A',
          driverId: loadDriverId,
          loadNumber: 'L-100',
          status: 'IN_TRANSIT',
          equipmentType: null,
          driverInstructions: null,
          stops: [],
          driver: null,
        }),
      },
      checkCallRepo: { create: jest.fn() },
      loadStatusService: { transitionStatus: jest.fn() },
      eventBus: { publish: jest.fn().mockResolvedValue(undefined), publishDelayed: jest.fn(), subscribe: jest.fn(), isReady: jest.fn(), close: jest.fn() },
      logger,
    });

  it('returns the load when the requesting driver is assigned', async () => {
    const service = makeService('driver-1');

    const load = await service.getLoadSummary('load-1', 'driver-1');

    expect(load.id).toBe('load-1');
  });

  it('throws ForbiddenError when a non-assigned driver requests the load', async () => {
    const service = makeService('driver-1');

    await expect(service.getLoadSummary('load-1', 'driver-2')).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when the load has no assigned driver', async () => {
    const service = makeService(null);

    await expect(service.getLoadSummary('load-1', 'driver-1')).rejects.toThrow(ForbiddenError);
  });
});
