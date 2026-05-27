import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getNavigate } from 'utils/getNavigate';
import { createCarrierWithAssets } from 'utils/api/fleet/carrierApi';
import type { CarrierListItem, DriverFormEntry, VehicleFormEntry } from '../../types';
import {
  createCarrierSuccess,
  createCarrierFailure,
  fetchCarriersRequest,
} from '../reducers/carrierNewPageSlice';
import { carrierActions } from '../reducers/carrierEntitySlice';
import type { CreateRequestPayload } from '../../../../mocho/redux/createCrudSlice';
import type { CarrierFormValues } from '../../validators/carrierSchema';

type CreateCarrierPayload = CarrierFormValues & {
  drivers: DriverFormEntry[];
  vehicles: VehicleFormEntry[];
};

export function* createCarrierSaga(
  action: PayloadAction<CreateRequestPayload<CreateCarrierPayload>>,
): Generator {
  try {
    const { drivers, vehicles, ...carrierFields } = action.payload.data;

    console.log('createCarrierSaga payload', {
      ...action.payload.data,
      driversCount: drivers.length,
      vehiclesCount: vehicles.length,
    });

    const mappedDrivers = drivers.map((d) => ({
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      email: d.email || undefined,
      licenseNumber: d.licenseNumber || undefined,
      licenseExpiry: d.licenseExpiry || undefined,
    }));

    const mappedVehicles = vehicles.map((v) => ({
      unitNumber: v.unitNumber,
      type: v.type,
      make: v.make || undefined,
      model: v.model || undefined,
      year: v.year ? parseInt(v.year, 10) : undefined,
      vin: v.vin || undefined,
      licensePlate: v.licensePlate || undefined,
    }));

    const response = (yield call(createCarrierWithAssets, {
      ...carrierFields,
      drivers: mappedDrivers,
      vehicles: mappedVehicles,
    })) as SagaReturnType<typeof createCarrierWithAssets>;

    // Optimistically add with actual driver/vehicle counts — the refetch below will replace it
    const carrierListItem: CarrierListItem = {
      ...response,
      driverCount: mappedDrivers.length,
      vehicleCount: mappedVehicles.length,
      onboardingComplete: false,
    };

    yield put(carrierActions.addOne(carrierListItem));
    yield put(createCarrierSuccess({}));

    yield put(notify({ message: 'Carrier created', variant: 'success' }));

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, '/carriers');

    yield put(fetchCarriersRequest({ page: 1, limit: 25 }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create carrier';
    yield put(createCarrierFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
