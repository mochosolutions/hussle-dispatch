import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { LoadingState, setPending, setFulfilled, setRejected } from '@mocho/ui/redux';
import type { CreateDriverInput, UpdateDriverInput } from 'features/carrier/types';

interface DriverPageState {
  loading: Record<string, string>;
  errors: Record<string, string>;
  page: number;
  limit: number;
  total: number;
  carrierIdFilter: string;
}

const initialState: DriverPageState = {
  loading: {},
  errors: {},
  page: 1,
  limit: 25,
  total: 0,
  carrierIdFilter: 'all',
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
} = driverPageSlice.actions;

export default driverPageSlice.reducer;

// Re-export LoadingState so selectors can use it without extra import
export { LoadingState };
