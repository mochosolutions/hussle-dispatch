export interface RefreshTokenSuccessResponse {
  message: string;
}

export const toRefreshTokenSuccessResponse = (): RefreshTokenSuccessResponse => ({
  message: 'Token refreshed successfully',
});
