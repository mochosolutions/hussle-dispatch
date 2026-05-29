import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { isAxiosError } from 'axios';
import { inviteMember } from 'utils/api/team/teamApi';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import {
  inviteMemberRequest,
  inviteMemberSuccess,
  inviteMemberFailure,
  fetchTeamRequest,
} from '../reducers/teamSlice';

export function* inviteMemberSaga(action: ReturnType<typeof inviteMemberRequest>): Generator {
  const inviteData = action.payload;

  try {
    const orgId = (yield select(organizationIdSelector)) as string;

    const result = (yield call(inviteMember, orgId, inviteData)) as SagaReturnType<
      typeof inviteMember
    >;

    // The API returns 200 even when an invite is skipped (e.g. already a member
    // or a pending invite already exists). Only treat it as success when an
    // invite was actually created — otherwise surface the skip reason.
    if (result.invites.length === 0) {
      const reason = result.skipped[0]?.reason ?? 'Invitation could not be sent';
      yield put(inviteMemberFailure(reason));
      yield put(notify({ message: reason, variant: 'warning' }));
      return;
    }

    yield put(inviteMemberSuccess({ invitations: result.invites }));
    yield put(notify({ message: `Invitation sent to ${inviteData.email}`, variant: 'success' }));

    yield put(fetchTeamRequest());
  } catch (error: unknown) {
    let errorMessage: string;

    if (isAxiosError(error) && error.response?.status === 429) {
      errorMessage =
        error.response.data?.message ?? 'Seat limit reached. Upgrade your plan to invite more members.';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
    }

    yield put(inviteMemberFailure(errorMessage));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
