import { call, put } from 'redux-saga/effects';
import type { SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { createOverride } from 'utils/api/fleet/driverAvailabilityApi';
import {
  createOverrideRequest,
  createOverrideSuccess,
  createOverrideFailure,
} from '../reducers/driverPageSlice';

type CreateOverrideAction = ReturnType<typeof createOverrideRequest>;

export function* createOverrideSaga(action: CreateOverrideAction): Generator {
  const { driverId, data } = action.payload;

  try {
    const response = (yield call(
      createOverride,
      driverId,
      data,
    )) as SagaReturnType<typeof createOverride>;

    yield put(createOverrideSuccess(response));
    yield call(enqueueSnackbar, 'Schedule override created', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create override';
    yield put(createOverrideFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
