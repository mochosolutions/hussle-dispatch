import type { RootState } from '../../../../store';
import { authSelector } from './authSelector';

export const initAttemptedSelector = (state: RootState) =>
  authSelector(state)?.initAttempted;
