import { all, call, put } from 'redux-saga/effects';
import type { SagaReturnType } from 'redux-saga/effects';
import { getWeeklySchedule, listOverrides } from 'utils/api/fleet/driverAvailabilityApi';
import {
  fetchScheduleRequest,
  fetchScheduleSuccess,
  fetchScheduleFailure,
} from '../reducers/driverPageSlice';

type FetchScheduleAction = ReturnType<typeof fetchScheduleRequest>;

export function* fetchDriverScheduleSaga(action: FetchScheduleAction): Generator {
  const { driverId } = action.payload;

  try {
    const [weeklySchedule, overrides] = (yield all([
      call(getWeeklySchedule, driverId),
      call(listOverrides, driverId),
    ])) as [
      SagaReturnType<typeof getWeeklySchedule>,
      SagaReturnType<typeof listOverrides>,
    ];

    yield put(fetchScheduleSuccess({ weeklySchedule, overrides }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch schedule';
    yield put(fetchScheduleFailure({ error: errorMessage }));
  }
}
