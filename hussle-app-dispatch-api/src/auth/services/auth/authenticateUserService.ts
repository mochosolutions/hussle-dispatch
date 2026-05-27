import { AuthStatus } from '@/shared/constants/authConstants';
import { AuthRequestError } from '@/shared/errors/authError';
import { UnauthorizedError } from '@/shared/errors';
import { logger } from '@/shared/utils/logger';
import { MembershipStatus } from '../../constants/enums';
import type { Membership } from '../../types/membershipTypes';
import type { User } from '../../types/user';
import type {
  AuthenticateUserInput,
  AuthenticateUserResult,
  AuthenticateUserServiceDeps,
} from '../../types/authProviderTypes';

const isUnconfirmedChallenge = (challengeName?: string): boolean => challengeName === 'UNCONFIRMED';

const isNewPasswordChallenge = (challengeName?: string): boolean =>
  challengeName === 'NEW_PASSWORD_REQUIRED';

const getActiveMembership = (memberships: Membership[]): Membership => {
  const membership = memberships.find((m) => m.status === MembershipStatus.ACTIVE);

  if (!membership) {
    throw new AuthRequestError('User does not have an active membership.');
  }

  return membership;
};

const createAuthenticatedUserPayload = (dbUser: User, organizationId: string) => ({
  ...dbUser,
  organizationId,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isInvalidCredentialsError = (error: unknown): boolean => {
  if (!isRecord(error)) {
    return false;
  }

  const errorName = error.name;
  const errorCode = error.code;

  return (
    errorName === 'UserNotFoundException' ||
    errorName === 'NotAuthorizedException' ||
    errorCode === 'UserNotFoundException' ||
    errorCode === 'NotAuthorizedException'
  );
};

export const authenticateUserService = async (
  { username, password, ipAddress, userAgent }: AuthenticateUserInput,
  {
    authProvider,
    tokenProvider,
    findMemberByUserId,
    findUserByExternalId,
  }: AuthenticateUserServiceDeps,
): Promise<AuthenticateUserResult> => {
  let authResponse: AuthenticateUserResult;

  try {
    authResponse = await authProvider.authenticateUser({
      username,
      password,
    });
  } catch (error: unknown) {
    logger.error('authenticateUser error', { error });

    if (isInvalidCredentialsError(error)) {
      throw new UnauthorizedError('Invalid email or password');
    }

    throw error;
  }

  logger.info('Auth response received', { challengeName: authResponse.challengeName });
  const user = { email: username };

  if (isUnconfirmedChallenge(authResponse.challengeName)) {
    return {
      status: AuthStatus.UNCONFIRMED,
      user,
    };
  }

  if (isNewPasswordChallenge(authResponse.challengeName)) {
    return {
      status: AuthStatus.CHALLENGE_REQUIRED,
      user,
      session: authResponse.session,
      challengeName: authResponse.challengeName,
    };
  }

  const { session, user: formattedUser } = authResponse;

  logger.info('Auth user formatted', { userId: formattedUser?.id });
  const formattedUserId = formattedUser?.id ?? '';
  const dbUser = await findUserByExternalId(formattedUserId);

  if (!dbUser) {
    throw new AuthRequestError('User not found in the database');
  }

  logger.info('DB user found', { userId: dbUser.id });

  const memberships = await findMemberByUserId(dbUser.id);

  logger.info('Memberships found', { count: memberships?.length ?? 0 });

  if (!memberships || memberships.length === 0) {
    throw new AuthRequestError('User does not have any memberships');
  }

  const membership = getActiveMembership(memberships);

  logger.info('Active membership selected', {
    membershipId: membership.membershipId,
    organizationId: membership.organizationId,
  });
  const sessionPayload = {
    userId: dbUser.id,
    organizationId: membership.organizationId,
    orgSlug: membership.orgSlug,
    orgSubscriptionTier: membership.orgSubscriptionTier,
    orgStatus: membership.orgStatus,
    membershipId: membership.membershipId,
    role: membership.role,
    permissionsVersion: membership.permissionsVersion,
    ipAddress,
    userAgent,
  };

  const { accessToken, refreshToken } = await tokenProvider.createSession(sessionPayload);
  const userPayload = createAuthenticatedUserPayload(dbUser, membership.organizationId);

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
};
