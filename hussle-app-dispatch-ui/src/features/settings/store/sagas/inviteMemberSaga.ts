import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
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

    yield put(inviteMemberSuccess({ invitations: result.invites }));
    yield call(enqueueSnackbar, `Invitation sent to ${inviteData.email}`, { variant: 'success' });

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
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
