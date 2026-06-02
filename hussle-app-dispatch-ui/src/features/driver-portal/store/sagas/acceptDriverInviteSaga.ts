import { call, put } from 'redux-saga/effects';
import { getNavigate } from 'utils/getNavigate';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { acceptDriverInvite } from 'utils/api/driver-portal/driverPortalApi';
import {
  acceptDriverInviteRequest,
  acceptDriverInviteSuccess,
  acceptDriverInviteFailure,
} from '../reducers/driverPortalPageSlice';

// Completes driver account setup from the invite link. The API sets the session
// cookies server-side, so on success we navigate straight into the portal — no
// separate login step. Mirrors the saga-driven org accept-invite flow.
export function* acceptDriverInviteSaga(
  action: ReturnType<typeof acceptDriverInviteRequest>,
): Generator {
  const { token, password, email, redirectTo } = action.payload;
  try {
    yield call(acceptDriverInvite, token, { password, email });
    yield put(acceptDriverInviteSuccess());
    yield put(notify({ message: 'Account ready. Welcome aboard.', variant: 'success' }));
    // navigate is the untyped saga `yield` result, matching the org loginSaga
    // pattern; `call(navigate, ...)` keeps the redirect testable.
    const navigate = yield call(getNavigate);
    yield call(navigate, redirectTo);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to complete setup';
    yield put(acceptDriverInviteFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
