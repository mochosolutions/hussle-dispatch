import { call, put, select } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { isAxiosError } from 'axios';
import { removeMember } from 'utils/api/team/teamApi';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import {
  removeMemberRequest,
  removeMemberSuccess,
  removeMemberFailure,
} from '../reducers/teamSlice';
import { teamEntityActions } from '../reducers/teamEntitySlice';

export function* removeMemberSaga(action: ReturnType<typeof removeMemberRequest>): Generator {
  const { membershipId } = action.payload;

  try {
    const orgId = (yield select(organizationIdSelector)) as string;

    yield call(removeMember, orgId, membershipId);

    yield put(teamEntityActions.removeOne(membershipId));
    yield put(removeMemberSuccess({ membershipId }));
    yield put(notify({ message: 'Member removed', variant: 'success' }));
  } catch (error: unknown) {
    let errorMessage: string;

    if (isAxiosError(error) && error.response?.status === 409) {
      errorMessage = 'Cannot remove: organization must have at least one admin';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
    }

    yield put(removeMemberFailure({ membershipId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
