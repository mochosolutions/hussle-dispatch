import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Agreement,
  CreateManualAgreementInput,
  RequestAgreementInput,
  VoidAgreementInput,
} from '../../types';

interface AgreementsState {
  byCarrierId: Record<string, Agreement[]>;
  loading: Record<string, 'Pending' | 'Fulfilled' | 'Rejected'>;
  errors: Record<string, string>;
}

const initialState: AgreementsState = {
  byCarrierId: {},
  loading: {},
  errors: {},
};

const upsertOne = (list: Agreement[], agreement: Agreement): Agreement[] => {
  const idx = list.findIndex((a) => a.id === agreement.id);
  if (idx === -1) {
    return [agreement, ...list];
  }
  return list.map((a) => (a.id === agreement.id ? agreement : a));
};

const agreementsSlice = createSlice({
  name: 'agreements',
  initialState,
  reducers: {
    fetchAgreementsRequest(state, action: PayloadAction<{ carrierId: string }>) {
      const key = `fetch:${action.payload.carrierId}`;
      state.loading[key] = 'Pending';
      state.errors[key] = '';
    },
    fetchAgreementsSuccess(
      state,
      action: PayloadAction<{ carrierId: string; agreements: Agreement[] }>,
    ) {
      const { carrierId, agreements } = action.payload;
      state.byCarrierId[carrierId] = agreements;
      state.loading[`fetch:${carrierId}`] = 'Fulfilled';
    },
    fetchAgreementsFailure(
      state,
      action: PayloadAction<{ carrierId: string; error: string }>,
    ) {
      const { carrierId, error } = action.payload;
      state.loading[`fetch:${carrierId}`] = 'Rejected';
      state.errors[`fetch:${carrierId}`] = error;
    },

    createManualAgreementRequest(_state, _action: PayloadAction<CreateManualAgreementInput>) {
      // tracked via local component state
    },
    createManualAgreementSuccess(state, action: PayloadAction<{ agreement: Agreement }>) {
      const { agreement } = action.payload;
      const existing = state.byCarrierId[agreement.carrierId] ?? [];
      state.byCarrierId[agreement.carrierId] = upsertOne(existing, agreement);
    },
    createManualAgreementFailure(_state, _action: PayloadAction<{ error: string }>) {
      // handled via toast
    },

    requestAgreementRequest(_state, _action: PayloadAction<RequestAgreementInput>) {},
    requestAgreementSuccess(state, action: PayloadAction<{ agreement: Agreement }>) {
      const { agreement } = action.payload;
      const existing = state.byCarrierId[agreement.carrierId] ?? [];
      state.byCarrierId[agreement.carrierId] = upsertOne(existing, agreement);
    },
    requestAgreementFailure(_state, _action: PayloadAction<{ error: string }>) {},

    voidAgreementRequest(_state, _action: PayloadAction<VoidAgreementInput>) {},
    voidAgreementSuccess(state, action: PayloadAction<{ agreement: Agreement }>) {
      const { agreement } = action.payload;
      const existing = state.byCarrierId[agreement.carrierId] ?? [];
      state.byCarrierId[agreement.carrierId] = upsertOne(existing, agreement);
    },
    voidAgreementFailure(_state, _action: PayloadAction<{ error: string }>) {},
  },
});

export const {
  fetchAgreementsRequest,
  fetchAgreementsSuccess,
  fetchAgreementsFailure,
  createManualAgreementRequest,
  createManualAgreementSuccess,
  createManualAgreementFailure,
  requestAgreementRequest,
  requestAgreementSuccess,
  requestAgreementFailure,
  voidAgreementRequest,
  voidAgreementSuccess,
  voidAgreementFailure,
} = agreementsSlice.actions;

export default agreementsSlice.reducer;
