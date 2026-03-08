import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
import { deleteDriver } from 'utils/api/fleet/driverApi';
import {
  deleteDriverRequest,
  deleteDriverSuccess,
  deleteDriverFailure,
} from '../reducers/driverPageSlice';
import { driverActions } from '../reducers/driverEntitySlice';

type DeleteDriverAction = ReturnType<typeof deleteDriverRequest>;

export function* deleteDriverSaga(action: DeleteDriverAction): Generator {
  const { id } = action.payload;

  try {
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
    if (useMock) {
      yield put(driverActions.removeOne(id));
      yield put(deleteDriverSuccess({ id }));
      yield call(enqueueSnackbar, 'Driver deleted', { variant: 'success' });
      return;
    }

    yield call(deleteDriver, id);

    yield put(driverActions.removeOne(id));
    yield put(deleteDriverSuccess({ id }));

    yield call(enqueueSnackbar, 'Driver deleted', { variant: 'success' });
  } catch (error: unknown) {
    let errorMessage: string;

    if (isAxiosError(error) && error.response?.status === 409) {
      errorMessage = 'Cannot delete: driver has active loads';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete driver';
    }

    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
    yield put(deleteDriverFailure({ error: errorMessage, id }));
  }
}
