import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getVehicle } from 'utils/api/fleet/vehicleApi';
import {
  fetchVehicleDetailsRequest,
  fetchVehicleDetailsSuccess,
  fetchVehicleDetailsFailure,
} from '../reducers/vehiclePageSlice';
import { vehicleActions } from '../reducers/vehicleEntitySlice';

export function* fetchVehicleDetailsSaga(
  action: ReturnType<typeof fetchVehicleDetailsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(getVehicle, id)) as SagaReturnType<typeof getVehicle>;

    yield put(vehicleActions.upsertOne(response));
    yield put(fetchVehicleDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load vehicle details';
    yield put(fetchVehicleDetailsFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
