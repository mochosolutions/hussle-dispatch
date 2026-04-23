import { createMemberManagementService } from '../memberManagementService';
import { LastAdminError, NotFoundError, ValidationError } from '@/shared/errors';
import type { MembershipWithUser } from '../../../types/membershipTypes';

describe('memberManagementService', () => {
  const mockDeps = {
    membershipRepository: {
      findMembershipsByFilter: jest.fn(),
      findOneByFilter: jest.fn(),
      updateMembership: jest.fn(),
    },
    tokenProvider: {
      createSession: jest.fn(),
      refreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      revokeSession: jest.fn(),
      revokeUserOrgSessions: jest.fn(),
      getSessionById: jest.fn(),
      getOrgSessions: jest.fn(),
      deleteOrgSessions: jest.fn(),
      verifyRefreshToken: jest.fn(),
    },
  };

  const service = createMemberManagementService(mockDeps);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const ORG_ID = 'org-1';
  const MEMBERSHIP_ID = 'membership-1';
  const USER_ID = 'user-1';
  const REQUESTING_USER_ID = 'user-requester';

  const makeMemberWithUser = (overrides: Partial<MembershipWithUser> = {}): MembershipWithUser => ({
    id: MEMBERSHIP_ID,
    userId: USER_ID,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    organizationId: ORG_ID,
    externalId: 'ext-1',
    role: 'dispatcher',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  describe('listMembers', () => {
    it('returns active members with user details', async () => {
      const members = [
        makeMemberWithUser(),
        makeMemberWithUser({ id: 'membership-2', userId: 'user-2', firstName: 'Jane' }),
      ];
      mockDeps.membershipRepository.findMembershipsByFilter.mockResolvedValue(members);

      const result = await service.listMembers({ organizationId: ORG_ID });

      expect(result).toEqual(members);
      expect(result).toHaveLength(2);
      expect(mockDeps.membershipRepository.findMembershipsByFilter).toHaveBeenCalledWith({
        organizationId: ORG_ID,
        deleted: false,
        status: 'active',
      });
    });

    it('returns empty array when no members found', async () => {
      mockDeps.membershipRepository.findMembershipsByFilter.mockResolvedValue(null);

      const result = await service.listMembers({ organizationId: ORG_ID });

      expect(result).toEqual([]);
    });
  });

  describe('changeMemberRole', () => {
    it('updates role successfully and returns old and new role', async () => {
      const membership = { membershipId: MEMBERSHIP_ID, userId: USER_ID, role: 'dispatcher', status: 'active', permissionsVersion: 1 };
      mockDeps.membershipRepository.findOneByFilter.mockResolvedValue(membership);
      mockDeps.membershipRepository.updateMembership.mockResolvedValue(undefined);

      const result = await service.changeMemberRole({
        organizationId: ORG_ID,
        membershipId: MEMBERSHIP_ID,
        role: 'admin',
      });

      expect(result).toEqual({ oldRole: 'dispatcher', newRole: 'admin' });
      expect(mockDeps.membershipRepository.updateMembership).toHaveBeenCalledWith(
        MEMBERSHIP_ID,
        { role: 'admin', permissionsVersion: 2 },
      );
      expect(mockDeps.tokenProvider.revokeUserOrgSessions).toHaveBeenCalledWith({
        userId: USER_ID,
        organizationId: ORG_ID,
      });
    });

    it('throws LastAdminError when demoting the only admin', async () => {
      const membership = { membershipId: MEMBERSHIP_ID, userId: USER_ID, role: 'admin', status: 'active', permissionsVersion: 1 };
      mockDeps.membershipRepository.findOneByFilter.mockResolvedValue(membership);
      mockDeps.membershipRepository.findMembershipsByFilter.mockResolvedValue([
        makeMemberWithUser({ role: 'admin' }),
      ]);

      await expect(
        service.changeMemberRole({
          organizationId: ORG_ID,
          membershipId: MEMBERSHIP_ID,
          role: 'dispatcher',
        }),
      ).rejects.toThrow(LastAdminError);
    });

    it('allows demoting admin when another admin exists', async () => {
      const membership = { membershipId: MEMBERSHIP_ID, userId: USER_ID, role: 'admin', status: 'active', permissionsVersion: 1 };
      mockDeps.membershipRepository.findOneByFilter.mockResolvedValue(membership);
      mockDeps.membershipRepository.findMembershipsByFilter.mockResolvedValue([
        makeMemberWithUser({ role: 'admin' }),
        makeMemberWithUser({ id: 'membership-2', userId: 'user-2', role: 'admin' }),
      ]);
      mockDeps.membershipRepository.updateMembership.mockResolvedValue(undefined);

      const result = await service.changeMemberRole({
        organizationId: ORG_ID,
        membershipId: MEMBERSHIP_ID,
        role: 'dispatcher',
      });

      expect(result).toEqual({ oldRole: 'admin', newRole: 'dispatcher' });
      expect(mockDeps.membershipRepository.updateMembership).toHaveBeenCalledWith(
        MEMBERSHIP_ID,
        { role: 'dispatcher', permissionsVersion: 2 },
      );
      expect(mockDeps.tokenProvider.revokeUserOrgSessions).toHaveBeenCalledWith({
        userId: USER_ID,
        organizationId: ORG_ID,
      });
    });

    it('throws ValidationError for invalid role', async () => {
      await expect(
        service.changeMemberRole({
          organizationId: ORG_ID,
          membershipId: MEMBERSHIP_ID,
          role: 'superuser' as 'admin',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when membership not found', async () => {
      mockDeps.membershipRepository.findOneByFilter.mockResolvedValue(null);

      await expect(
        service.changeMemberRole({
          organizationId: ORG_ID,
          membershipId: 'nonexistent',
          role: 'dispatcher',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('removeMember', () => {
    it('soft-deletes membership and revokes sessions', async () => {
      const membership = { membershipId: MEMBERSHIP_ID, userId: USER_ID, role: 'dispatcher', status: 'active', permissionsVersion: 1 };
      mockDeps.membershipRepository.findOneByFilter.mockResolvedValue(membership);
      mockDeps.membershipRepository.updateMembership.mockResolvedValue(undefined);
      mockDeps.tokenProvider.revokeUserOrgSessions.mockResolvedValue(1);

      await service.removeMember({
        organizationId: ORG_ID,
        membershipId: MEMBERSHIP_ID,
        requestingUserId: REQUESTING_USER_ID,
      });

      expect(mockDeps.membershipRepository.updateMembership).toHaveBeenCalledWith(
        MEMBERSHIP_ID,
        expect.objectContaining({
          deleted: true,
          status: 'deleted',
          deletedAt: expect.any(Date),
        }),
      );
      expect(mockDeps.tokenProvider.revokeUserOrgSessions).toHaveBeenCalledWith({
        userId: USER_ID,
        organizationId: ORG_ID,
      });
    });

    it('throws LastAdminError when removing the only admin', async () => {
      const membership = { membershipId: MEMBERSHIP_ID, userId: USER_ID, role: 'admin', status: 'active', permissionsVersion: 1 };
      mockDeps.membershipRepository.findOneByFilter.mockResolvedValue(membership);
      mockDeps.membershipRepository.findMembershipsByFilter.mockResolvedValue([
        makeMemberWithUser({ role: 'admin' }),
      ]);

      await expect(
        service.removeMember({
          organizationId: ORG_ID,
          membershipId: MEMBERSHIP_ID,
          requestingUserId: REQUESTING_USER_ID,
        }),
      ).rejects.toThrow(LastAdminError);
    });

    it('throws LastAdminError when user tries to remove themselves', async () => {
      const membership = { membershipId: MEMBERSHIP_ID, userId: USER_ID, role: 'dispatcher', status: 'active', permissionsVersion: 1 };
      mockDeps.membershipRepository.findOneByFilter.mockResolvedValue(membership);

      await expect(
        service.removeMember({
          organizationId: ORG_ID,
          membershipId: MEMBERSHIP_ID,
          requestingUserId: USER_ID,
        }),
      ).rejects.toThrow(LastAdminError);
    });

    it('throws NotFoundError when membership not found', async () => {
      mockDeps.membershipRepository.findOneByFilter.mockResolvedValue(null);

      await expect(
        service.removeMember({
          organizationId: ORG_ID,
          membershipId: 'nonexistent',
          requestingUserId: REQUESTING_USER_ID,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
