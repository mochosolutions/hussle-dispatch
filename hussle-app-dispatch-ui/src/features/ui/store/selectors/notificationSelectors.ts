import type { RootState } from 'store';

export const selectPendingNotifications = (state: RootState) =>
  state.pages.notifications.pending;
