import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
import { changeMemberRole } from 'utils/api/team/teamApi';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import {
  changeMemberRoleRequest,
  changeMemberRoleSuccess,
  changeMemberRoleFailure,
} from '../reducers/teamSlice';
import { teamEntityActions } from '../reducers/teamEntitySlice';

export function* changeMemberRoleSaga(
  action: ReturnType<typeof changeMemberRoleRequest>,
): Generator {
  const { membershipId, role } = action.payload;

  try {
    const orgId = (yield select(organizationIdSelector)) as string;

    const updatedMember = (yield call(
      changeMemberRole,
      orgId,
      membershipId,
      role,
    )) as SagaReturnType<typeof changeMemberRole>;

    yield put(teamEntityActions.upsertOne(updatedMember));
    yield put(changeMemberRoleSuccess(updatedMember));
    yield call(enqueueSnackbar, 'Role updated', { variant: 'success' });
  } catch (error: unknown) {
    let errorMessage: string;

    if (isAxiosError(error) && error.response?.status === 409) {
      errorMessage = 'Cannot change role: organization must have at least one admin';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Failed to update role';
    }

    yield put(changeMemberRoleFailure({ membershipId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
