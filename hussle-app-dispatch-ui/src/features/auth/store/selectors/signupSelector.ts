import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import { authSelector, currentUserSelector } from './authSelector';
import { obfuscateEmail } from 'utils/obfuscateEmail';

export const userFullNameSelector = createSelector(
  currentUserSelector,
  (user) => `${user?.firstName} ${user?.lastName}`,
);

export const signupEmailSelector = (state: RootState) =>
  currentUserSelector(state).email;

export const obfuscatedSignupEmailSelector = createSelector(
  signupEmailSelector,
  (email) => obfuscateEmail(email),
);

export const authLoadingObjSelector = (state: RootState) =>
  authSelector(state).loading;

export const signupLoadingStateSelector = (state: RootState) =>
  authLoadingObjSelector(state)?.signup;

export const confirmCodeLoadingStateSelector = (state: RootState) =>
  authLoadingObjSelector(state)?.confirmCode;

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
