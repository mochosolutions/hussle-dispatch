import { all, call, put, select, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getMembers, getInvitations, getSubscriptionUsage } from 'utils/api/team/teamApi';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import { fetchTeamSuccess, fetchTeamFailure } from '../reducers/teamSlice';
import { teamEntityActions } from '../reducers/teamEntitySlice';

export function* fetchTeamSaga(): Generator {
  try {
    const orgId = (yield select(organizationIdSelector)) as string;

    const [members, invitations, usage] = (yield all([
      call(getMembers, orgId),
      call(getInvitations, orgId),
      call(getSubscriptionUsage, orgId),
    ])) as [
      SagaReturnType<typeof getMembers>,
      SagaReturnType<typeof getInvitations>,
      SagaReturnType<typeof getSubscriptionUsage>,
    ];

    yield put(teamEntityActions.setAll(members));
    yield put(fetchTeamSuccess({ members, invitations, usage }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load team data';
    yield put(fetchTeamFailure(errorMessage));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
