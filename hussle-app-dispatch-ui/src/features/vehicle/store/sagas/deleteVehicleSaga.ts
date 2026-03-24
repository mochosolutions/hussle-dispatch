import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
import { deleteVehicle } from 'utils/api/fleet/vehicleApi';
import {
  deleteVehicleRequest,
  deleteVehicleSuccess,
  deleteVehicleFailure,
} from '../reducers/vehiclePageSlice';
import { vehicleActions } from '../reducers/vehicleEntitySlice';

export function* deleteVehicleSaga(action: ReturnType<typeof deleteVehicleRequest>): Generator {
  const { id } = action.payload;

  try {
    yield call(deleteVehicle, id);

    yield put(vehicleActions.removeOne(id));
    yield put(deleteVehicleSuccess({ id }));

    yield call(enqueueSnackbar, 'Vehicle deleted', { variant: 'success' });
  } catch (error: unknown) {
    let errorMessage: string;

    if (isAxiosError(error) && error.response?.status === 409) {
      errorMessage = 'Cannot delete: vehicle has active loads';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete vehicle';
    }

    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
    yield put(deleteVehicleFailure({ error: errorMessage, id }));
  }
}
