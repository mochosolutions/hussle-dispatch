import { logger } from '@/shared/utils/logger';
import type { Membership } from '../../types/membershipTypes';
import type { ITokenProvider } from '../../types/tokenProvider';

export interface SwitchOrgInput {
  userId: string;
  sessionId: string;
  organizationId: string;
  refreshToken: string;
}

export interface SwitchOrgDeps {
  tokenProvider: ITokenProvider;
  findUserByIdWithMemberships: (userId: string) => Promise<any>;
}

export const switchOrgService = async (data: SwitchOrgInput, deps: SwitchOrgDeps) => {
  const { userId, sessionId, refreshToken: ogRefreshToken, organizationId } = data;
  const { tokenProvider, findUserByIdWithMemberships } = deps;

  logger.info('Switching organization for user', { userId, organizationId });

  // Single query to get user with memberships
  const userWithMemberships = await findUserByIdWithMemberships(userId);

  if (!userWithMemberships) {
    throw new Error('User not found');
  }

  const membership = userWithMemberships.memberships?.find(
    (m: Membership) => m.organizationId === organizationId && m.status === 'active'
  );

  if (!membership) {
    throw new Error('User does not have an active membership in the target organization');
  }

  logger.info('SwitchOrgService found memberships', { count: userWithMemberships.memberships?.length ?? 0 });

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
    // permissionsVersion: 1,
  });

  return {
    accessToken: newAccessToken,
    refreshToken,
    user: formattedUser,
    orgs: userWithMemberships.memberships,
  };
};
