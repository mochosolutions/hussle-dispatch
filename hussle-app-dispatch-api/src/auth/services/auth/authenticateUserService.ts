import { AuthStatus } from '@/shared/constants/authConstants';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type {
  AuthenticateUserInput,
  AuthenticateUserResult,
  AuthenticateUserServiceDeps,
} from '../../types/authProviderTypes';

export const authenticateUserService = async (
  { username, password }: AuthenticateUserInput,
  {
    authProvider,
    tokenProvider,
    findMemberByUserId,
    findUserByExternalId,
  }: AuthenticateUserServiceDeps
): Promise<AuthenticateUserResult> => {
  try {
    const authResponse = await authProvider.authenticateUser({
      username,
      password,
    });

    logger.info('Auth response received', { challengeName: authResponse.challengeName });
    const user = { email: username };

    if (authResponse.challengeName === 'UNCONFIRMED') {
      return {
        status: AuthStatus.UNCONFIRMED,
        user,
      };
    }

    if (authResponse.challengeName === 'NEW_PASSWORD_REQUIRED') {
      return {
        status: AuthStatus.CHALLENGE_REQUIRED,
        user,
        session: authResponse.session,
        challengeName: authResponse.challengeName,
      };
    }

    const { session, user: formattedUser } = authResponse;

    logger.info('Auth user formatted', { userId: formattedUser?.id });
    const formatedUserId = formattedUser?.id ?? '';
    const dbUser = await findUserByExternalId(formatedUserId);

    if (!dbUser) {
      throw new AuthRequestError('User not found in the database');
    }

    logger.info('DB user found', { userId: dbUser.id });

    const memberships = await findMemberByUserId(dbUser.id);

    logger.info('Memberships found', { count: memberships?.length ?? 0 });

    if (!memberships || memberships.length === 0) {
      throw new AuthRequestError('User does not have any memberships');
    }

    // Use first membership (user can switch orgs later via switchOrgService)
    const membership = memberships[0];

    if (!membership) {
      throw new AuthRequestError('User does not have an active membership.');
    }

    logger.info('Active membership selected', { membershipId: membership.membershipId, organizationId: membership.organizationId });
    const sesssionPayload = {
      userId: dbUser.id,
      organizationId: membership.organizationId,
      orgSlug: membership.orgSlug,
      orgSubscriptionTier: membership.orgSubscriptionTier,
      orgStatus: membership.orgStatus,
      membershipId: membership.membershipId,
      role: membership.role,
      // permissionsVersion: membership.permissionsVersion,
    };

    const { accessToken, refreshToken } = await tokenProvider.createSession(sesssionPayload);

    const userPayload = {
      ...dbUser,
      organizationId: membership.organizationId,
    };

    return {
      session,
      orgs: memberships,
      user: userPayload,
      status: AuthStatus.AUTHENTICATED,
      token: {
        accessToken,
        refreshToken,
      },
    };
  } catch (e: any) {
    logger.error('authenticateUser error', { error: e });
    throw new AuthRequestError('Failed to authenticate user');
  }
};
