import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getLoad } from 'utils/api/loads/loadApi';
import type { LoadListItem } from '../../types';
import {
  fetchLoadDetailsRequest,
  fetchLoadDetailsSuccess,
  fetchLoadDetailsFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

export function* fetchLoadDetailSaga(
  action: ReturnType<typeof fetchLoadDetailsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(getLoad, id)) as SagaReturnType<typeof getLoad>;

    const { load } = response;

    // Map LoadDetail to LoadListItem for entity store
    const origin = load.stops.find((s) => s.type === 'PICKUP');
    const deliveries = load.stops.filter((s) => s.type === 'DELIVERY');
    const lastDelivery = deliveries[deliveries.length - 1];

    const loadListItem: LoadListItem = {
      id: load.id,
      loadNumber: load.loadNumber,
      status: load.status,
      equipmentType: load.equipmentType,
      commodity: load.commodity,
      customerRate: load.customerRate,
      carrierRate: load.carrierRate,
      totalMiles: load.totalMiles,
      ratePerMile: load.ratePerMile,
      carrierId: load.carrierId,
      carrierName: load.carrier?.name ?? null,
      driverId: load.driverId,
      driverName: load.driver
        ? `${load.driver.firstName} ${load.driver.lastName}`
        : null,
      originCity: origin?.city ?? null,
      originState: origin?.state ?? null,
      destinationCity: lastDelivery?.city ?? null,
      destinationState: lastDelivery?.state ?? null,
      accessorialChargeCount: load.accessorialCharges.length,
      createdAt: load.createdAt,
      updatedAt: load.updatedAt,
    };

    yield put(loadActions.upsertOne(loadListItem));
    yield put(fetchLoadDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load load details';
    yield put(fetchLoadDetailsFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
