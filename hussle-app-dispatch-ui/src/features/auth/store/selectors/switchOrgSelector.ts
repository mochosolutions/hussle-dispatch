import {createSelector} from '@reduxjs/toolkit';
import {authSelector} from './authSelector';

export const authLoadingObjSelector = createSelector(
  authSelector,
  (auth) => auth.loading,
);


export const switchOrgLoadingStateSelector = createSelector(
  authLoadingObjSelector,
  (loadingObj) => loadingObj?.switchOrg,
);

export const switchOrgLoadingSelector = createSelector(
  switchOrgLoadingStateSelector,
  (loadingState) => loadingState === 'Pending',
);
export const switchOrgErrorSelector = createSelector(
  switchOrgLoadingStateSelector,
  (loadingState) => loadingState === 'Rejected',
);


