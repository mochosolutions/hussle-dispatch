import type { Role } from '@/config/roles';
import { ROLES } from '@/config/roles';
import { LastAdminError, NotFoundError, ValidationError } from '@/shared/errors';
import type { MembershipWithUser } from '../../types/membershipTypes';
import type { ITokenProvider } from '../../types/tokenProvider';

interface MembershipRepositoryPort {
  findMembershipsByFilter(
    filter: Record<string, unknown>,
  ): Promise<MembershipWithUser[] | null>;
  findOneByFilter(
    filter: Record<string, unknown>,
  ): Promise<{ membershipId: string; userId: string; role: string; status: string } | null>;
  updateMembership(
    id: string,
    data: Record<string, unknown>,
  ): Promise<unknown>;
}

export interface MemberManagementServiceDeps {
  membershipRepository: MembershipRepositoryPort;
  tokenProvider: ITokenProvider;
}

interface ListMembersInput {
  organizationId: string;
}

interface ChangeMemberRoleInput {
  organizationId: string;
  membershipId: string;
  role: Role;
}

interface RemoveMemberInput {
  organizationId: string;
  membershipId: string;
  requestingUserId: string;
}

export interface MemberManagementService {
  listMembers(input: ListMembersInput): Promise<MembershipWithUser[]>;
  changeMemberRole(input: ChangeMemberRoleInput): Promise<void>;
  removeMember(input: RemoveMemberInput): Promise<void>;
}

const VALID_ROLES = Object.values(ROLES);

const isValidRole = (role: string): role is Role =>
  VALID_ROLES.includes(role as Role);

const countActiveAdmins = async (
  membershipRepository: MembershipRepositoryPort,
  organizationId: string,
): Promise<number> => {
  const admins = await membershipRepository.findMembershipsByFilter({
    organizationId,
    role: ROLES.ADMIN,
    status: 'active',
    deleted: false,
  });

  return admins?.length ?? 0;
};

export const createMemberManagementService = (
  deps: MemberManagementServiceDeps,
): MemberManagementService => ({
  listMembers: async ({ organizationId }) => {
    const members = await deps.membershipRepository.findMembershipsByFilter({
      organizationId,
      deleted: false,
      status: 'active',
    });

    return members ?? [];
  },

  changeMemberRole: async ({ organizationId, membershipId, role }) => {
    if (!isValidRole(role)) {
      throw new ValidationError(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const membership = await deps.membershipRepository.findOneByFilter({
      id: membershipId,
      organizationId,
    });

    if (!membership) {
      throw new NotFoundError(`Membership ${membershipId} not found in organization`);
    }

    if (membership.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
      const adminCount = await countActiveAdmins(deps.membershipRepository, organizationId);

      if (adminCount <= 1) {
        throw new LastAdminError(
          'Cannot change role: this is the only admin in the organization',
        );
      }
    }

    await deps.membershipRepository.updateMembership(membershipId, { role });
  },

  removeMember: async ({ organizationId, membershipId, requestingUserId }) => {
    const membership = await deps.membershipRepository.findOneByFilter({
      id: membershipId,
      organizationId,
    });

    if (!membership) {
      throw new NotFoundError(`Membership ${membershipId} not found in organization`);
    }

    if (membership.userId === requestingUserId) {
      throw new LastAdminError('Cannot remove yourself');
    }

    if (membership.role === ROLES.ADMIN) {
      const adminCount = await countActiveAdmins(deps.membershipRepository, organizationId);

      if (adminCount <= 1) {
        throw new LastAdminError(
          'Cannot remove the only admin in the organization',
        );
      }
    }

    await deps.membershipRepository.updateMembership(membershipId, {
      deleted: true,
      deletedAt: new Date(),
      status: 'deleted',
    });

    await deps.tokenProvider.revokeUserOrgSessions({
      userId: membership.userId,
      organizationId,
    });
  },
});
