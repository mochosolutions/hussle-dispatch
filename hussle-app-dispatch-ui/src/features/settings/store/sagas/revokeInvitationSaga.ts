import { call, put, select } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { revokeInvitation } from 'utils/api/team/teamApi';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import {
  revokeInvitationRequest,
  revokeInvitationSuccess,
  revokeInvitationFailure,
} from '../reducers/teamSlice';

export function* revokeInvitationSaga(
  action: ReturnType<typeof revokeInvitationRequest>,
): Generator {
  const { inviteId } = action.payload;

  try {
    const orgId = (yield select(organizationIdSelector)) as string;

    yield call(revokeInvitation, orgId, inviteId);

    yield put(revokeInvitationSuccess({ inviteId }));
    yield put(notify({ message: 'Invitation revoked', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to revoke invitation';
    yield put(revokeInvitationFailure({ inviteId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
