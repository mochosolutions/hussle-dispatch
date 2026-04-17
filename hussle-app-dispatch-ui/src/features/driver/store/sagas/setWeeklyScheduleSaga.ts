import { call, put } from 'redux-saga/effects';
import type { SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { setWeeklySchedule } from 'utils/api/fleet/driverAvailabilityApi';
import {
  setWeeklyScheduleRequest,
  setWeeklyScheduleSuccess,
  setWeeklyScheduleFailure,
} from '../reducers/driverPageSlice';

type SetWeeklyScheduleAction = ReturnType<typeof setWeeklyScheduleRequest>;

export function* setWeeklyScheduleSaga(action: SetWeeklyScheduleAction): Generator {
  const { driverId, entries } = action.payload;

  try {
    const response = (yield call(
      setWeeklySchedule,
      driverId,
      entries,
    )) as SagaReturnType<typeof setWeeklySchedule>;

    yield put(setWeeklyScheduleSuccess(response));
    yield call(enqueueSnackbar, 'Weekly schedule updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update schedule';
    yield put(setWeeklyScheduleFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
