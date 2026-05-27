import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import { authSelector } from './authSelector';

export const authLoadingObjSelector = (state: RootState) =>
  authSelector(state).loading;

export const switchOrgLoadingStateSelector = (state: RootState) =>
  authLoadingObjSelector(state)?.switchOrg;

export const switchOrgLoadingSelector = createSelector(
  switchOrgLoadingStateSelector,
  (loadingState) => loadingState === 'Pending',
);

export const switchOrgErrorSelector = createSelector(
  switchOrgLoadingStateSelector,
  (loadingState) => loadingState === 'Rejected',
);
