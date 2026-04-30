import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { LoadingState, setPending, setFulfilled, setRejected } from '@mocho/ui/redux';
import type { CreateDriverInput, UpdateDriverInput } from 'features/carrier/types';
import type {
  WeeklyScheduleEntry,
  ScheduleOverride,
  CreateScheduleOverrideInput,
} from '../../types';

interface DriverPageState {
  loading: Record<string, string>;
  errors: Record<string, string>;
  hasLoadedOnce: boolean;
  lastFetchedAt: number | null;
  page: number;
  limit: number;
  total: number;
  carrierIdFilter: string;
  query: string;
  weeklySchedule: WeeklyScheduleEntry[];
  scheduleOverrides: ScheduleOverride[];
}

const initialState: DriverPageState = {
  loading: { getAll: LoadingState.Pending },
  errors: {},
  hasLoadedOnce: false,
  lastFetchedAt: null,
  page: 1,
  limit: 25,
  total: 0,
  carrierIdFilter: 'all',
  query: '',
  weeklySchedule: [],
  scheduleOverrides: [],
};

interface FetchDriversRequestPayload {
  page?: number;
  limit?: number;
  search?: string;
  carrierId?: string;
  status?: string;
}

interface FetchDriversSuccessPayload {
  total: number;
  page: number;
  limit: number;
}

interface FailurePayload {
  error: string;
  id?: string;
}

interface UpdateDriverRequestPayload {
  id: string;
  data: UpdateDriverInput;
}

interface UpdateDriverSuccessPayload {
  id: string;
}

interface DeleteDriverRequestPayload {
  id: string;
}

interface DeleteDriverSuccessPayload {
  id: string;
}

interface FetchDriverDetailsRequestPayload {
  id: string;
}

interface FetchDriverDetailsSuccessPayload {
  id: string;
}

const driverPageSlice = createSlice({
  name: 'driverPage',
  initialState,
  reducers: {
    fetchDriversRequest(state, _action: PayloadAction<FetchDriversRequestPayload>) {
      setPending(state, { key: 'getAll' });
    },
    fetchDriversSuccess(state, action: PayloadAction<FetchDriversSuccessPayload>) {
      setFulfilled(state, { loadingKey: 'getAll', errorKey: 'getAll' });
      state.hasLoadedOnce = true;
      state.lastFetchedAt = Date.now();
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
    },
    fetchDriversFailure(state, action: PayloadAction<FailurePayload>) {
      setRejected(state, {
        loadingKey: 'getAll',
        errorKey: 'getAll',
        failureMessage: action.payload.error,
      });
    },

    fetchDriverDetailsRequest(state, action: PayloadAction<FetchDriverDetailsRequestPayload>) {
      const key = `getById:${action.payload.id}`;
      setPending(state, { key });
    },
    fetchDriverDetailsSuccess(state, action: PayloadAction<FetchDriverDetailsSuccessPayload>) {
      const key = `getById:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    },
    fetchDriverDetailsFailure(state, action: PayloadAction<FailurePayload>) {
      const key = action.payload.id ? `getById:${action.payload.id}` : 'getById';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error,
      });
    },

    createDriverRequest(state, _action: PayloadAction<{ data: CreateDriverInput }>) {
      setPending(state, { key: 'create' });
    },
    createDriverSuccess(state, _action: PayloadAction<void>) {
      setFulfilled(state, { loadingKey: 'create', errorKey: 'create' });
    },
    createDriverFailure(state, action: PayloadAction<FailurePayload>) {
      setRejected(state, {
        loadingKey: 'create',
        errorKey: 'create',
        failureMessage: action.payload.error,
      });
    },

    updateDriverRequest(state, action: PayloadAction<UpdateDriverRequestPayload>) {
      const key = `update:${action.payload.id}`;
      setPending(state, { key });
    },
    updateDriverSuccess(state, action: PayloadAction<UpdateDriverSuccessPayload>) {
      const key = `update:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    },
    updateDriverFailure(state, action: PayloadAction<FailurePayload>) {
      const key = action.payload.id ? `update:${action.payload.id}` : 'update';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error,
      });
    },

    deleteDriverRequest(state, action: PayloadAction<DeleteDriverRequestPayload>) {
      const key = `delete:${action.payload.id}`;
      setPending(state, { key });
    },
    deleteDriverSuccess(state, action: PayloadAction<DeleteDriverSuccessPayload>) {
      const key = `delete:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    },
    deleteDriverFailure(state, action: PayloadAction<FailurePayload>) {
      const key = action.payload.id ? `delete:${action.payload.id}` : 'delete';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error,
      });
    },

    setCarrierIdFilter(state, action: PayloadAction<string>) {
      state.carrierIdFilter = action.payload;
    },

    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },

    // ----- Schedule: fetch weekly + overrides -----
    fetchScheduleRequest(state, _action: PayloadAction<{ driverId: string }>) {
      setPending(state, { key: 'schedule' });
    },
    fetchScheduleSuccess(
      state,
      action: PayloadAction<{
        weeklySchedule: WeeklyScheduleEntry[];
        overrides: ScheduleOverride[];
      }>,
    ) {
      setFulfilled(state, { loadingKey: 'schedule', errorKey: 'schedule' });
      state.weeklySchedule = action.payload.weeklySchedule;
      state.scheduleOverrides = action.payload.overrides;
    },
    fetchScheduleFailure(state, action: PayloadAction<FailurePayload>) {
      setRejected(state, {
        loadingKey: 'schedule',
        errorKey: 'schedule',
        failureMessage: action.payload.error,
      });
    },

    // ----- Schedule: set weekly -----
    setWeeklyScheduleRequest(
      state,
      _action: PayloadAction<{ driverId: string; entries: WeeklyScheduleEntry[] }>,
    ) {
      setPending(state, { key: 'setWeekly' });
    },
    setWeeklyScheduleSuccess(state, action: PayloadAction<WeeklyScheduleEntry[]>) {
      setFulfilled(state, { loadingKey: 'setWeekly', errorKey: 'setWeekly' });
      state.weeklySchedule = action.payload;
    },
    setWeeklyScheduleFailure(state, action: PayloadAction<FailurePayload>) {
      setRejected(state, {
        loadingKey: 'setWeekly',
        errorKey: 'setWeekly',
        failureMessage: action.payload.error,
      });
    },

    // ----- Schedule: create override -----
    createOverrideRequest(
      state,
      _action: PayloadAction<{ driverId: string; data: CreateScheduleOverrideInput }>,
    ) {
      setPending(state, { key: 'createOverride' });
    },
    createOverrideSuccess(state, action: PayloadAction<ScheduleOverride>) {
      setFulfilled(state, { loadingKey: 'createOverride', errorKey: 'createOverride' });
      state.scheduleOverrides = [...state.scheduleOverrides, action.payload];
    },
    createOverrideFailure(state, action: PayloadAction<FailurePayload>) {
      setRejected(state, {
        loadingKey: 'createOverride',
        errorKey: 'createOverride',
        failureMessage: action.payload.error,
      });
    },

    // ----- Schedule: delete override -----
    deleteOverrideRequest(
      state,
      _action: PayloadAction<{ driverId: string; overrideId: string }>,
    ) {
      setPending(state, { key: 'deleteOverride' });
    },
    deleteOverrideSuccess(state, action: PayloadAction<{ overrideId: string }>) {
      setFulfilled(state, { loadingKey: 'deleteOverride', errorKey: 'deleteOverride' });
      state.scheduleOverrides = state.scheduleOverrides.filter(
        (o) => o.id !== action.payload.overrideId,
      );
    },
    deleteOverrideFailure(state, action: PayloadAction<FailurePayload>) {
      setRejected(state, {
        loadingKey: 'deleteOverride',
        errorKey: 'deleteOverride',
        failureMessage: action.payload.error,
      });
    },
  },
});

export const {
  fetchDriversRequest,
  fetchDriversSuccess,
  fetchDriversFailure,
  fetchDriverDetailsRequest,
  fetchDriverDetailsSuccess,
  fetchDriverDetailsFailure,
  createDriverRequest,
  createDriverSuccess,
  createDriverFailure,
  updateDriverRequest,
  updateDriverSuccess,
  updateDriverFailure,
  deleteDriverRequest,
  deleteDriverSuccess,
  deleteDriverFailure,
  setCarrierIdFilter,
  setQuery,
  fetchScheduleRequest,
  fetchScheduleSuccess,
  fetchScheduleFailure,
  setWeeklyScheduleRequest,
  setWeeklyScheduleSuccess,
  setWeeklyScheduleFailure,
  createOverrideRequest,
  createOverrideSuccess,
  createOverrideFailure,
  deleteOverrideRequest,
  deleteOverrideSuccess,
  deleteOverrideFailure,
} = driverPageSlice.actions;

export default driverPageSlice.reducer;

// Re-export LoadingState so selectors can use it without extra import
export { LoadingState };
