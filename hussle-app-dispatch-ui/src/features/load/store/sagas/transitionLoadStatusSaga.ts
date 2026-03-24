import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { transitionStatus } from 'utils/api/loads/loadApi';
import type { LoadListItem } from '../../types';
import {
  transitionLoadStatusRequest,
  transitionLoadStatusSuccess,
  transitionLoadStatusFailure,
  showTransitionWarnings,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

export function* transitionLoadStatusSaga(
  action: ReturnType<typeof transitionLoadStatusRequest>,
): Generator {
  const { loadId, input } = action.payload;

  try {
    const response = (yield call(
      transitionStatus,
      loadId,
      input,
    )) as SagaReturnType<typeof transitionStatus>;

    // Handle warnings — dispatch for UI to display confirmation dialog
    if (!response.success && response.warnings && response.warnings.length > 0) {
      yield put(showTransitionWarnings({ loadId, warnings: response.warnings }));
      return;
    }

    // Handle hard error from API
    if (!response.success && response.error) {
      const errorMessage = response.error.message;
      yield put(transitionLoadStatusFailure({ loadId, error: errorMessage }));
      yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
      return;
    }

    // Success — update entity in store
    if (response.load) {
      const { load } = response;
      const origin = (load.stops ?? []).find((s) => s.type === 'PICKUP');
      const deliveries = (load.stops ?? []).filter((s) => s.type === 'DELIVERY');
      const lastDelivery = deliveries[deliveries.length - 1];

      const changes: Partial<LoadListItem> = {
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
      };

      yield put(loadActions.updateOne({ id: loadId, changes }));
    }

    yield put(transitionLoadStatusSuccess({ loadId, newStatus: input.status }));
    yield call(enqueueSnackbar, 'Status updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to transition status';
    yield put(transitionLoadStatusFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
