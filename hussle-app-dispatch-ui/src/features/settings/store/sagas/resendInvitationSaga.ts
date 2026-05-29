import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { resendInvitation } from 'utils/api/team/teamApi';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import {
  resendInvitationRequest,
  resendInvitationSuccess,
  resendInvitationFailure,
} from '../reducers/teamSlice';

export function* resendInvitationSaga(
  action: ReturnType<typeof resendInvitationRequest>,
): Generator {
  const { inviteId } = action.payload;

  try {
    const orgId = (yield select(organizationIdSelector)) as string;

    const invitation = (yield call(resendInvitation, orgId, inviteId)) as SagaReturnType<
      typeof resendInvitation
    >;

    yield put(resendInvitationSuccess({ invitation }));
    yield put(notify({ message: `Invitation re-sent to ${invitation.email}`, variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to resend invitation';
    yield put(resendInvitationFailure({ inviteId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
