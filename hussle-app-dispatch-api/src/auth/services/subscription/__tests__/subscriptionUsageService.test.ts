import type { PrismaClient } from '@prisma/client';
import { createSubscriptionUsageService } from '../subscriptionUsageService';
import { SUBSCRIPTION_LIMITS } from '@/config/subscriptionLimits';

describe('subscriptionUsageService', () => {
  const mockPrisma = {
    membership: { count: jest.fn() },
    invitation: { count: jest.fn() },
    vehicle: { count: jest.fn() },
  };

  const service = createSubscriptionUsageService({
    prismaClient: mockPrisma as unknown as PrismaClient,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('counts active members plus outstanding invites against the user limit', async () => {
    // Arrange
    mockPrisma.membership.count.mockResolvedValue(2);
    mockPrisma.invitation.count.mockResolvedValue(1);
    mockPrisma.vehicle.count.mockResolvedValue(1);

    // Act
    const result = await service.getUsage({ organizationId: 'org-1' });

    // Assert
    expect(result).toEqual({
      users: {
        current: 3,
        limit: SUBSCRIPTION_LIMITS.maxUsers,
      },
      vehicles: {
        current: 1,
        limit: SUBSCRIPTION_LIMITS.maxVehicles,
      },
    });

    expect(mockPrisma.membership.count).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deleted: false,
        status: 'active',
        // DRIVER memberships are first-class portal users, not billable seats.
        role: { not: 'driver' },
      },
    });

    expect(mockPrisma.invitation.count).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        status: 'PENDING',
        expiresAt: { gt: expect.any(Date) },
      },
    });

    expect(mockPrisma.vehicle.count).toHaveBeenCalledWith({
      where: {
        carrier: { managedByOrgId: 'org-1' },
        isActive: true,
        deletedAt: null,
      },
    });
  });

  it('returns zero counts when no members or vehicles exist', async () => {
    // Arrange
    mockPrisma.membership.count.mockResolvedValue(0);
    mockPrisma.invitation.count.mockResolvedValue(0);
    mockPrisma.vehicle.count.mockResolvedValue(0);

    // Act
    const result = await service.getUsage({ organizationId: 'org-empty' });

    // Assert
    expect(result).toEqual({
      users: {
        current: 0,
        limit: SUBSCRIPTION_LIMITS.maxUsers,
      },
      vehicles: {
        current: 0,
        limit: SUBSCRIPTION_LIMITS.maxVehicles,
      },
    });
  });
});
