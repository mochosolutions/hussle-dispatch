import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
import { assignLoad, transitionStatus } from 'utils/api/loads/loadApi';
import type { LoadListItem } from '../../types';
import {
  assignAndDispatchRequest,
  assignAndDispatchSuccess,
  assignAndDispatchFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

export function* assignAndDispatchSaga(
  action: ReturnType<typeof assignAndDispatchRequest>,
): Generator {
  const { loadId, assignment, notes } = action.payload;

  try {
    // Step 1: Assign driver/vehicle/carrier
    const assignResponse = (yield call(
      assignLoad,
      loadId,
      assignment,
    )) as SagaReturnType<typeof assignLoad>;

    if (assignResponse.warnings.length > 0) {
      assignResponse.warnings.forEach((warning) => {
        enqueueSnackbar(warning.message, { variant: 'warning' });
      });
    }

    // Update entity store after assignment
    const assignedLoad = assignResponse.load;
    const origin = (assignedLoad.stops ?? []).find((s) => s.type === 'PICKUP');
    const deliveries = (assignedLoad.stops ?? []).filter((s) => s.type === 'DELIVERY');
    const lastDelivery = deliveries[deliveries.length - 1];

    yield put(
      loadActions.updateOne({
        id: loadId,
        changes: {
          status: assignedLoad.status,
          equipmentType: assignedLoad.equipmentType,
          commodity: assignedLoad.commodity,
          customerRate: assignedLoad.customerRate,
          carrierPayout: assignedLoad.carrierPayout,
          totalMiles: assignedLoad.totalMiles,
          ratePerMile: assignedLoad.ratePerMile,
          ratePerTotalMile: assignedLoad.ratePerTotalMile ?? null,
          carrierId: assignedLoad.carrierId,
          carrierName: assignedLoad.carrier?.name ?? null,
          driverId: assignedLoad.driverId,
          driverName: assignedLoad.driver
            ? `${assignedLoad.driver.firstName} ${assignedLoad.driver.lastName}`
            : null,
          originCity: origin?.city ?? null,
          originState: origin?.state ?? null,
          destinationCity: lastDelivery?.city ?? null,
          destinationState: lastDelivery?.state ?? null,
          accessorialChargeCount: assignedLoad.accessorialCharges.length,
          updatedAt: assignedLoad.updatedAt,
        } satisfies Partial<LoadListItem>,
      }),
    );

    // Step 2: Transition to DISPATCHED
    const transitionResponse = (yield call(transitionStatus, loadId, {
      status: 'DISPATCHED',
      notes: notes || undefined,
    })) as SagaReturnType<typeof transitionStatus>;

    if (!transitionResponse.success && transitionResponse.error) {
      yield put(assignAndDispatchFailure({ loadId, error: transitionResponse.error.message }));
      yield call(enqueueSnackbar, transitionResponse.error.message, { variant: 'error' });
      return;
    }

    // Update entity store after transition
    if (transitionResponse.load) {
      const { load } = transitionResponse;
      const tOrigin = (load.stops ?? []).find((s) => s.type === 'PICKUP');
      const tDeliveries = (load.stops ?? []).filter((s) => s.type === 'DELIVERY');
      const tLastDelivery = tDeliveries[tDeliveries.length - 1];

      yield put(
        loadActions.updateOne({
          id: loadId,
          changes: {
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
            originCity: tOrigin?.city ?? null,
            originState: tOrigin?.state ?? null,
            destinationCity: tLastDelivery?.city ?? null,
            destinationState: tLastDelivery?.state ?? null,
            accessorialChargeCount: load.accessorialCharges.length,
            updatedAt: load.updatedAt,
          } satisfies Partial<LoadListItem>,
        }),
      );
      yield put(loadActions.upsertOne(load));
    }

    yield put(assignAndDispatchSuccess({ loadId }));
    yield call(enqueueSnackbar, 'Load assigned and dispatched', { variant: 'success' });
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.data) {
      const { data } = error.response;

      // 422 blocker errors from assignment validation
      if (error.response.status === 422 && Array.isArray(data.blockers) && data.blockers.length > 0) {
        const blockerMessages = data.blockers
          .map((b: { message: string }) => b.message)
          .join('\n');
        yield put(assignAndDispatchFailure({ loadId, error: blockerMessages }));
        yield call(enqueueSnackbar, blockerMessages, { variant: 'error' });
        return;
      }

      // Structured API errors (e.g., 400 from transition)
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const apiMessage = data.errors
          .map((e: { message: string }) => e.message)
          .join('\n');
        yield put(assignAndDispatchFailure({ loadId, error: apiMessage }));
        yield call(enqueueSnackbar, apiMessage, { variant: 'error' });
        return;
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to assign and dispatch load';
    yield put(assignAndDispatchFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
