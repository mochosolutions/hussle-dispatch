import {createSelector} from '@reduxjs/toolkit';
import {authSelector, currentUserSelector} from './authSelector';
import {obfuscateEmail} from 'utils/obfuscateEmail';

export const userFullNameSelector = createSelector(
  currentUserSelector,
  (user) => `${user?.firstName} ${user?.lastName}`,
);

export const signupEmailSelector = createSelector(
  currentUserSelector,
  (user) => user.email,
);
export const obfuscatedSignupEmailSelector = createSelector(
  signupEmailSelector,
  (email) => obfuscateEmail(email),
);

export const authLoadingObjSelector = createSelector(
  authSelector,
  (auth) => auth.loading,
);
export const signupLoadingStateSelector = createSelector(
  authLoadingObjSelector,
  (loadingObj) => loadingObj?.signup,
);

export const confirmCodeLoadingStateSelector = createSelector(
  authLoadingObjSelector,
  (loadingObj) => loadingObj?.confirmCode,
);

export const isSignupPageLoadingSelector = createSelector(
  signupLoadingStateSelector,
  (loadingState) => loadingState === 'Pending',
);
export const isSignupErrorSelector = createSelector(
  signupLoadingStateSelector,
  (loadingState) => loadingState === 'Rejected',
);

export const isConfirmCodeLoadingSelector = createSelector(
  confirmCodeLoadingStateSelector,
  (loadingState) => loadingState === 'Pending',
);

export const isConfirmCodeErrorSelector = createSelector(
  confirmCodeLoadingStateSelector,
  (loadingState) => loadingState === 'Rejected',
);
