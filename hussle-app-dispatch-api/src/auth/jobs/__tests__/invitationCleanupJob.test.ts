import { InvitationStatus } from '@prisma/client';
import { createInvitationCleanupJob } from '../invitationCleanupJob';

const NOW = new Date('2026-05-29T12:00:00.000Z');
const RETENTION_DAYS = 30;

describe('invitationCleanupJob', () => {
  const updateMany = jest.fn();
  const deleteMany = jest.fn();
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  const buildJob = () =>
    createInvitationCleanupJob({
      // Only the invitation delegate is exercised by the sweep.
      prisma: { invitation: { updateMany, deleteMany } } as never,
      logger,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    updateMany.mockResolvedValue({ count: 2 });
    deleteMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expires past-due PENDING invitations', async () => {
    // Act
    await buildJob().runNow();

    // Assert
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lt: NOW },
      },
      data: { status: InvitationStatus.EXPIRED },
    });
  });

  it('purges terminal invitations older than the retention window', async () => {
    // Arrange
    const expectedCutoff = new Date(NOW.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Act
    await buildJob().runNow();

    // Assert
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        status: { in: [InvitationStatus.EXPIRED, InvitationStatus.REVOKED] },
        updatedAt: { lt: expectedCutoff },
      },
    });
  });

  it('logs the expired and purged counts', async () => {
    // Act
    await buildJob().runNow();

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      'Invitation cleanup complete',
      expect.objectContaining({ expired: 2, purged: 1 }),
    );
  });
});
