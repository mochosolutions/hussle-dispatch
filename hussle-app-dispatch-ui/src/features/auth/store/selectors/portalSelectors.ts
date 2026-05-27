import type { RootState } from '../../../../store';

export const portalSessionExpiredSelector = (state: RootState): boolean =>
  state.auth.portalSessionExpired;
