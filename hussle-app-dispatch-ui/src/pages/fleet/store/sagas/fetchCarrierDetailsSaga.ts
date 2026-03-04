import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getCarrier } from 'utils/api/fleet/carrierApi';
import type { RootState } from 'store';
import type { CarrierListItem } from 'pages/fleet/types';
import {
  fetchCarrierDetailsRequest,
  fetchCarrierDetailsSuccess,
  fetchCarrierDetailsFailure,
} from '../reducers/carrierPageSlice';
import { carrierActions, carrierSelectors } from '../reducers/carrierEntitySlice';

export function* fetchCarrierDetailsSaga(
  action: ReturnType<typeof fetchCarrierDetailsRequest>,
): Generator {
  try {
    const { id } = action.payload;

    const response = (yield call(getCarrier, id)) as SagaReturnType<typeof getCarrier>;

    // Preserve list-only fields from existing entity if already loaded
    const state = (yield select()) as RootState;
    const existing = carrierSelectors.selectById(state, id);

    const carrierListItem: CarrierListItem = {
      driverCount: existing?.driverCount ?? 0,
      vehicleCount: existing?.vehicleCount ?? 0,
      onboardingComplete: existing?.onboardingComplete ?? false,
      ...response.carrier,
    };

    yield put(carrierActions.upsertOne(carrierListItem));
    yield put(fetchCarrierDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load carrier details';
    yield put(fetchCarrierDetailsFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
