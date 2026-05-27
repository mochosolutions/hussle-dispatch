import { call, put } from 'redux-saga/effects';
import { closeSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { resetPopups } from 'features/ui/store/reducers/uiSlice';
import { SessionExpiredContext } from '../../types';
import type { sessionExpired } from '../authSlice';

export function* sessionExpiredSaga(action: ReturnType<typeof sessionExpired>) {
  const { context } = action.payload;

  if (context === SessionExpiredContext.PORTAL) {
    // Reducer already set portalSessionExpired; PortalSessionGuard reacts.
    return;
  }

  yield put(resetPopups());
  yield call(closeSnackbar);

  try {
    const navigate: ReturnType<typeof getNavigate> = yield call(getNavigate);
    if (typeof navigate === 'function') {
      yield call(navigate, '/login');
    }
  } catch (error: unknown) {
    // Navigation not available (e.g., outside React tree). AuthGuard reacts to
    // isLoggedIn=false on next render, so this is a soft fallback.
    console.warn('sessionExpiredSaga: navigate unavailable; relying on AuthGuard', error);
  }
}
