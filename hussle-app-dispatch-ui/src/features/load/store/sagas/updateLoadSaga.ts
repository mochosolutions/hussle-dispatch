import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
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

    const load = (yield call(updateLoad, id, data)) as SagaReturnType<typeof updateLoad>;

    // Map detail back to list item fields for entity store
    const origin = (load.stops ?? []).find((s) => s.type === 'PICKUP');
    const deliveries = (load.stops ?? []).filter((s) => s.type === 'DELIVERY');
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
          carrierPayout: load.carrierPayout,
          totalMiles: load.totalMiles,
          ratePerMile: load.ratePerMile,
          ratePerTotalMile: load.ratePerTotalMile ?? null,
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
    yield put(loadActions.upsertOne(load));
    yield put(updateLoadSuccess({ id }));

    yield call(enqueueSnackbar, 'Load updated', { variant: 'success' });
  } catch (error: unknown) {
    // Parse structured blocker errors from assignment validation (422)
    if (isAxiosError(error) && error.response?.status === 422) {
      const blockers = error.response.data?.blockers;
      if (Array.isArray(blockers) && blockers.length > 0) {
        const blockerMessages = blockers
          .map((b: { message: string }) => b.message)
          .join('\n');
        yield put(updateLoadFailure({ error: blockerMessages }));
        yield call(enqueueSnackbar, blockerMessages, { variant: 'error' });
        return;
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to update load';
    yield put(updateLoadFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
