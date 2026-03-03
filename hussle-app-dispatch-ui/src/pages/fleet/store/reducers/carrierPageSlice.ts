import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { LoadingState, setPending, setFulfilled, setRejected } from '@mocho/ui/redux';
import type { CreateCarrierInput, UpdateCarrierInput } from '../../types';

interface CarrierPageState {
  loading: Record<string, string>;
  errors: Record<string, string>;
  page: number;
  limit: number;
  total: number;
  typeFilter: string;
}

const initialState: CarrierPageState = {
  loading: {},
  errors: {},
  page: 1,
  limit: 25,
  total: 0,
  typeFilter: 'all',
};

interface FetchCarriersRequestPayload {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}

interface FetchCarriersSuccessPayload {
  total: number;
  page: number;
  limit: number;
}

interface FailurePayload {
  error: string;
  id?: string;
}

interface UpdateCarrierRequestPayload {
  id: string;
  data: UpdateCarrierInput;
}

interface UpdateCarrierSuccessPayload {
  id: string;
}

interface DeleteCarrierRequestPayload {
  id: string;
}

interface DeleteCarrierSuccessPayload {
  id: string;
}

interface FetchCarrierDetailsRequestPayload {
  id: string;
}

interface FetchCarrierDetailsSuccessPayload {
  id: string;
}

const carrierPageSlice = createSlice({
  name: 'carrierPage',
  initialState,
  reducers: {
    fetchCarriersRequest(state, _action: PayloadAction<FetchCarriersRequestPayload>) {
      setPending(state, { key: 'getAll' });
    },
    fetchCarriersSuccess(state, action: PayloadAction<FetchCarriersSuccessPayload>) {
      setFulfilled(state, { loadingKey: 'getAll', errorKey: 'getAll' });
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
    },
    fetchCarriersFailure(state, action: PayloadAction<FailurePayload>) {
      setRejected(state, {
        loadingKey: 'getAll',
        errorKey: 'getAll',
        failureMessage: action.payload.error,
      });
    },

    fetchCarrierDetailsRequest(state, action: PayloadAction<FetchCarrierDetailsRequestPayload>) {
      const key = `getById:${action.payload.id}`;
      setPending(state, { key });
    },
    fetchCarrierDetailsSuccess(state, action: PayloadAction<FetchCarrierDetailsSuccessPayload>) {
      const key = `getById:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    },
    fetchCarrierDetailsFailure(state, action: PayloadAction<FailurePayload>) {
      const key = action.payload.id ? `getById:${action.payload.id}` : 'getById';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error,
      });
    },

    createCarrierRequest(state, _action: PayloadAction<{ data: CreateCarrierInput }>) {
      setPending(state, { key: 'create' });
    },
    createCarrierSuccess(state, _action: PayloadAction<void>) {
      setFulfilled(state, { loadingKey: 'create', errorKey: 'create' });
    },
    createCarrierFailure(state, action: PayloadAction<FailurePayload>) {
      setRejected(state, {
        loadingKey: 'create',
        errorKey: 'create',
        failureMessage: action.payload.error,
      });
    },

    updateCarrierRequest(state, action: PayloadAction<UpdateCarrierRequestPayload>) {
      const key = `update:${action.payload.id}`;
      setPending(state, { key });
    },
    updateCarrierSuccess(state, action: PayloadAction<UpdateCarrierSuccessPayload>) {
      const key = `update:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    },
    updateCarrierFailure(state, action: PayloadAction<FailurePayload>) {
      const key = action.payload.id ? `update:${action.payload.id}` : 'update';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error,
      });
    },

    deleteCarrierRequest(state, action: PayloadAction<DeleteCarrierRequestPayload>) {
      const key = `delete:${action.payload.id}`;
      setPending(state, { key });
    },
    deleteCarrierSuccess(state, action: PayloadAction<DeleteCarrierSuccessPayload>) {
      const key = `delete:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    },
    deleteCarrierFailure(state, action: PayloadAction<FailurePayload>) {
      const key = action.payload.id ? `delete:${action.payload.id}` : 'delete';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error,
      });
    },

    setTypeFilter(state, action: PayloadAction<string>) {
      state.typeFilter = action.payload;
    },
  },
});

export const {
  fetchCarriersRequest,
  fetchCarriersSuccess,
  fetchCarriersFailure,
  fetchCarrierDetailsRequest,
  fetchCarrierDetailsSuccess,
  fetchCarrierDetailsFailure,
  createCarrierRequest,
  createCarrierSuccess,
  createCarrierFailure,
  updateCarrierRequest,
  updateCarrierSuccess,
  updateCarrierFailure,
  deleteCarrierRequest,
  deleteCarrierSuccess,
  deleteCarrierFailure,
  setTypeFilter,
} = carrierPageSlice.actions;

export default carrierPageSlice.reducer;

// Re-export LoadingState so selectors can use it without extra import
export { LoadingState };
