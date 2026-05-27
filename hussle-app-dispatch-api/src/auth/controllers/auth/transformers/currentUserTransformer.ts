import type { currentUserService } from '../../../services/auth/currentUserService';

type CurrentUserServiceResult = NonNullable<Awaited<ReturnType<typeof currentUserService>>>;

export interface CurrentUserResponse {
  accessibleOrgs: CurrentUserServiceResult['accessibleOrgs'];
  user: CurrentUserServiceResult['user'];
  message: string;
  accessTokenExpiresAt: string;
}

export const toCurrentUserResponse = (
  result: CurrentUserServiceResult,
  accessTokenExpiresAt: string
): CurrentUserResponse => ({
  accessibleOrgs: result.accessibleOrgs,
  user: result.user,
  message: 'Current user fetched successfully',
  accessTokenExpiresAt,
});
