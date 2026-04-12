import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
import { assignLoad } from 'utils/api/loads/loadApi';
import type { LoadListItem } from '../../types';
import {
  assignLoadRequest,
  assignLoadSuccess,
  assignLoadFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

export function* assignLoadSaga(action: ReturnType<typeof assignLoadRequest>): Generator {
  const { loadId, data } = action.payload;

  try {
    const response = (yield call(assignLoad, loadId, data)) as SagaReturnType<typeof assignLoad>;

    if (response.warnings.length > 0) {
      response.warnings.forEach((warning) => {
        enqueueSnackbar(warning.message, { variant: 'warning' });
      });
    }

    const { load } = response;
    const origin = (load.stops ?? []).find((s) => s.type === 'PICKUP');
    const deliveries = (load.stops ?? []).filter((s) => s.type === 'DELIVERY');
    const lastDelivery = deliveries[deliveries.length - 1];

    const changes: Partial<LoadListItem> = {
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
      driverName: load.driver ? `${load.driver.firstName} ${load.driver.lastName}` : null,
      originCity: origin?.city ?? null,
      originState: origin?.state ?? null,
      destinationCity: lastDelivery?.city ?? null,
      destinationState: lastDelivery?.state ?? null,
      accessorialChargeCount: load.accessorialCharges.length,
      updatedAt: load.updatedAt,
    };

    yield put(loadActions.updateOne({ id: loadId, changes }));
    yield put(loadActions.upsertOne(load));
    yield put(assignLoadSuccess({ loadId }));
    yield call(enqueueSnackbar, 'Assignment updated', { variant: 'success' });
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 422) {
      const blockers = error.response.data?.blockers;
      if (Array.isArray(blockers) && blockers.length > 0) {
        const blockerMessages = blockers
          .map((b: { message: string }) => b.message)
          .join('\n');
        yield put(assignLoadFailure({ loadId, error: blockerMessages }));
        yield call(enqueueSnackbar, blockerMessages, { variant: 'error' });
        return;
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to update assignment';
    yield put(assignLoadFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
