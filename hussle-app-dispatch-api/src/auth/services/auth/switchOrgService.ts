import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type { Membership } from '../../types/membershipTypes';
import type { ITokenProvider } from '../../types/tokenProvider';
import type { User } from '../../types/user';

export interface SwitchOrgInput {
  userId: string;
  sessionId: string;
  organizationId: string;
  refreshToken: string;
}

interface UserWithMemberships extends User {
  memberships: Membership[];
}

interface SwitchOrgResult {
  accessToken: string;
  refreshToken: string;
  user: User & { organizationId: string };
  orgs: Membership[];
}

export interface SwitchOrgDeps {
  tokenProvider: ITokenProvider;
  findUserByIdWithMemberships: (userId: string) => Promise<UserWithMemberships | null>;
}

const getTargetMembership = (memberships: Membership[], organizationId: string): Membership => {
  const membership = memberships.find(
    (item) => item.organizationId === organizationId && item.status === 'active',
  );

  if (!membership) {
    throw new AuthRequestError(
      'User does not have an active membership in the target organization',
    );
  }

  return membership;
};

export const switchOrgService = async (
  data: SwitchOrgInput,
  deps: SwitchOrgDeps,
): Promise<SwitchOrgResult> => {
  const { userId, sessionId, refreshToken: ogRefreshToken, organizationId } = data;
  const { tokenProvider, findUserByIdWithMemberships } = deps;

  logger.info('Switching organization for user', { userId, organizationId });

  // Single query to get user with memberships
  const userWithMemberships = await findUserByIdWithMemberships(userId);

  if (!userWithMemberships) {
    throw new AuthRequestError('User not found');
  }

  const membership = getTargetMembership(userWithMemberships.memberships, organizationId);

  logger.info('SwitchOrgService found memberships', {
    count: userWithMemberships.memberships?.length ?? 0,
  });

  const formattedUser = {
    ...userWithMemberships,
    organizationId,
  };

  logger.info('Formatted user for org switch', { userId, organizationId });

  await tokenProvider.revokeSession({ sessionId, refreshToken: ogRefreshToken });
  const { accessToken: newAccessToken, refreshToken } = await tokenProvider.createSession({
    userId,
    organizationId,
    orgSlug: membership.orgSlug,
    orgSubscriptionTier: membership.orgSubscriptionTier,
    membershipId: membership.membershipId,
    orgStatus: membership.orgStatus,
    role: membership.role,
  });

  return {
    accessToken: newAccessToken,
    refreshToken,
    user: formattedUser,
    orgs: userWithMemberships.memberships,
  };
};
