import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { createDriver } from 'utils/api/fleet/driverApi';
import type { Driver } from 'features/carrier/types';
import {
  createDriverRequest,
  createDriverSuccess,
  createDriverFailure,
} from '../reducers/driverPageSlice';
import { driverActions } from '../reducers/driverEntitySlice';

type CreateDriverAction = ReturnType<typeof createDriverRequest>;

export function* createDriverSaga(action: CreateDriverAction): Generator {
  try {
    const { data } = action.payload;
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
    if (useMock) {
      const now = new Date().toISOString();
      const mockDriver: Driver = {
        id: crypto.randomUUID(),
        carrierId: data.carrierId ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        cdlNumber: data.cdlNumber ?? null,
        cdlState: data.cdlState ?? null,
        cdlExpiry: data.cdlExpiry ?? null,
        isAvailable: data.isAvailable ?? true,
        status: data.status ?? 'active',
        homeBaseCity: data.homeBaseCity ?? null,
        homeBaseState: data.homeBaseState ?? null,
        availableHours: data.availableHours ?? null,
        currentCity: data.currentCity ?? null,
        currentState: data.currentState ?? null,
        maxDaysOut: data.maxDaysOut ?? null,
        preferredLanes: data.preferredLanes ?? [],
        noGoZones: data.noGoZones ?? [],
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      yield put(driverActions.addOne(mockDriver));
      yield put(createDriverSuccess());
      yield call(enqueueSnackbar, 'Driver created', { variant: 'success' });

      const navigate = (yield call(getNavigate)) as (path: string) => void;
      yield call(navigate, '/drivers');
      return;
    }

    const response = (yield call(
      createDriver,
      data,
    )) as SagaReturnType<typeof createDriver>;

    yield put(driverActions.addOne(response.driver));
    yield put(createDriverSuccess());

    yield call(enqueueSnackbar, 'Driver created', { variant: 'success' });

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, '/drivers');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create driver';
    yield put(createDriverFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
