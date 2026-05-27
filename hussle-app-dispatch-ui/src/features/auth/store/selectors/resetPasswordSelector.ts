import type { RootState } from '../../../../store';
import { authSelector } from './authSelector';

export const isInitatePassResetLoadingSelector = (state: RootState) =>
  (authSelector(state)?.loading.initPasswordReset ?? '') === 'Pending';

export const isConfirmPasswordResetLoadingSelector = (state: RootState) =>
  (authSelector(state)?.loading.confirmPasswordReset ?? '') === 'Pending';

export const isInitatePassResetErrorSelector = (state: RootState) =>
  (authSelector(state)?.loading.initPasswordReset ?? '') === 'Rejected';

export const isConfirmPasswordResetErrorSelector = (state: RootState) =>
  (authSelector(state)?.loading.confirmPasswordReset ?? '') === 'Rejected';
