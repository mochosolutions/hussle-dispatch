import {createSelector} from '@reduxjs/toolkit';
import {authSelector} from './authSelector';

export const initAttemptedSelector = createSelector(
  authSelector,
  (authState) => authState?.initAttempted,
);
