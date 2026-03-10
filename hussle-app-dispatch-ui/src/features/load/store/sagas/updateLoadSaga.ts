import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { updateLoad } from 'utils/api/loads/loadApi';
import type { UpdateLoadInput } from '../../types';
import {
  updateLoadSuccess,
  updateLoadFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';
import type { UpdateRequestPayload } from '../../../../mocho/redux/createCrudSlice';

export function* updateLoadSaga(
  action: PayloadAction<UpdateRequestPayload<UpdateLoadInput>>,
): Generator {
  try {
    const { id, data } = action.payload;

    const response = (yield call(updateLoad, id, data)) as SagaReturnType<typeof updateLoad>;

    const { load } = response;

    // Map detail back to list item fields for entity store
    const origin = load.stops.find((s) => s.type === 'PICKUP');
    const deliveries = load.stops.filter((s) => s.type === 'DELIVERY');
    const lastDelivery = deliveries[deliveries.length - 1];

    yield put(
      loadActions.updateOne({
        id,
        changes: {
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
          updatedAt: load.updatedAt,
        },
      }),
    );
    yield put(updateLoadSuccess({ id }));

    yield call(enqueueSnackbar, 'Load updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update load';
    yield put(updateLoadFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
