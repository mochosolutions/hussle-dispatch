import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getVehicle } from 'utils/api/fleet/vehicleApi';
import { MOCK_VEHICLES } from '../../mockData';
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
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

    if (useMock) {
      const mockVehicle = MOCK_VEHICLES.find((v) => v.id === id);

      if (mockVehicle) {
        yield put(vehicleActions.upsertOne(mockVehicle));
        yield put(fetchVehicleDetailsSuccess({ id }));
      } else {
        yield put(fetchVehicleDetailsFailure({ id, error: 'Vehicle not found' }));
        yield call(enqueueSnackbar, 'Vehicle not found', { variant: 'error' });
      }

      return;
    }

    const response = (yield call(getVehicle, id)) as SagaReturnType<typeof getVehicle>;

    yield put(vehicleActions.upsertOne(response.vehicle));
    yield put(fetchVehicleDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load vehicle details';
    yield put(fetchVehicleDetailsFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
