import type { PrismaClient } from '@prisma/client';
import { carrierInviteTokenRepoPrisma } from '../carrierInviteTokenRepoPrisma';

type FindFirstArgs = Parameters<PrismaClient['carrierInviteToken']['findFirst']>[0];

describe('carrierInviteTokenRepoPrisma', () => {
  describe('findByToken', () => {
    it('filters by revokedAt null, expiresAt > now, org not deleted, carrier not deleted', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const repo = carrierInviteTokenRepoPrisma({
        carrierInviteToken: { findFirst },
      } as unknown as PrismaClient);

      await repo.findByToken('abc');

      expect(findFirst).toHaveBeenCalledTimes(1);
      const args = findFirst.mock.calls[0][0] as FindFirstArgs;
      expect(args?.where).toMatchObject({
        token: 'abc',
        revokedAt: null,
        organization: { is: { deleted: false } },
        carrier: { is: { deletedAt: null } },
      });
      expect(args?.where?.expiresAt).toBeDefined();
    });

    it('returns null when prisma returns null (matches the deleted-org / deleted-carrier / expired / revoked case)', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const repo = carrierInviteTokenRepoPrisma({
        carrierInviteToken: { findFirst },
      } as unknown as PrismaClient);

      const result = await repo.findByToken('any-token');

      expect(result).toBeNull();
    });

    it('returns the token when the prisma row matches all filters', async () => {
      const row = { id: 'tok-1', token: 'abc', carrierId: 'c-1', organizationId: 'o-1' };
      const findFirst = jest.fn().mockResolvedValue(row);
      const repo = carrierInviteTokenRepoPrisma({
        carrierInviteToken: { findFirst },
      } as unknown as PrismaClient);

      const result = await repo.findByToken('abc');

      expect(result).toBe(row);
    });
  });

  describe('revokeByOrganizationId', () => {
    it('sets revokedAt on all non-revoked tokens for the org', async () => {
      const updateMany = jest.fn().mockResolvedValue({ count: 3 });
      const repo = carrierInviteTokenRepoPrisma({
        carrierInviteToken: { updateMany },
      } as unknown as PrismaClient);

      await repo.revokeByOrganizationId('org-1');

      expect(updateMany).toHaveBeenCalledTimes(1);
      const args = updateMany.mock.calls[0][0];
      expect(args).toMatchObject({
        where: { organizationId: 'org-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('revokeByCarrierId', () => {
    it('sets revokedAt on all non-revoked tokens for the carrier', async () => {
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const repo = carrierInviteTokenRepoPrisma({
        carrierInviteToken: { updateMany },
      } as unknown as PrismaClient);

      await repo.revokeByCarrierId('carrier-1');

      const args = updateMany.mock.calls[0][0];
      expect(args).toMatchObject({
        where: { carrierId: 'carrier-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
