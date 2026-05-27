export interface RefreshTokenSuccessResponse {
  message: string;
  accessTokenExpiresAt: string;
}

export const toRefreshTokenSuccessResponse = (
  accessTokenExpiresAt: string
): RefreshTokenSuccessResponse => ({
  message: 'Token refreshed successfully',
  accessTokenExpiresAt,
});
