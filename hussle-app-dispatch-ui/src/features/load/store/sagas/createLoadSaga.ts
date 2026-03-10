import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { createLoad } from 'utils/api/loads/loadApi';
import type { CreateLoadInput, LoadListItem } from '../../types';
import {
  createLoadSuccess,
  createLoadFailure,
  fetchLoadsRequest,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';
import type { CreateRequestPayload } from '../../../../mocho/redux/createCrudSlice';

export function* createLoadSaga(
  action: PayloadAction<CreateRequestPayload<CreateLoadInput>>,
): Generator {
  try {
    const { data } = action.payload;

    const response = (yield call(createLoad, data)) as SagaReturnType<typeof createLoad>;

    const { load } = response;

    // Map detail to list item for entity store
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

    yield put(loadActions.addOne(loadListItem));
    yield put(createLoadSuccess({}));

    yield call(enqueueSnackbar, 'Load created', { variant: 'success' });

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, `/loads/${load.id}?showRateConPrompt=true`);

    yield put(fetchLoadsRequest({ page: 1, limit: 25 }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create load';
    yield put(createLoadFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
