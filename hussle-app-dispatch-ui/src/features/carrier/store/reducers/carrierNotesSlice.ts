import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CarrierNote, CreateCarrierNoteInput } from '../../types';

interface CarrierNotesState {
  notesByCarrierId: Record<string, CarrierNote[]>;
  loading: Record<string, string>;
  errors: Record<string, string>;
}

const initialState: CarrierNotesState = {
  notesByCarrierId: {},
  loading: {},
  errors: {},
};

const carrierNotesSlice = createSlice({
  name: 'carrierNotes',
  initialState,
  reducers: {
    fetchCarrierNotesRequest(state, action: PayloadAction<{ carrierId: string }>) {
      const key = `fetch:${action.payload.carrierId}`;
      state.loading[key] = 'Pending';
      state.errors[key] = '';
    },
    fetchCarrierNotesSuccess(
      state,
      action: PayloadAction<{ carrierId: string; notes: CarrierNote[] }>,
    ) {
      const { carrierId, notes } = action.payload;
      state.notesByCarrierId[carrierId] = notes;
      state.loading[`fetch:${carrierId}`] = 'Fulfilled';
    },
    fetchCarrierNotesFailure(
      state,
      action: PayloadAction<{ carrierId: string; error: string }>,
    ) {
      const { carrierId, error } = action.payload;
      state.loading[`fetch:${carrierId}`] = 'Rejected';
      state.errors[`fetch:${carrierId}`] = error;
    },

    createCarrierNoteRequest(
      _state,
      _action: PayloadAction<{ carrierId: string; data: CreateCarrierNoteInput }>,
    ) {
      // loading handled by UI state
    },
    createCarrierNoteSuccess(
      state,
      action: PayloadAction<{ carrierId: string; note: CarrierNote }>,
    ) {
      const { carrierId, note } = action.payload;
      const existing = state.notesByCarrierId[carrierId] ?? [];
      state.notesByCarrierId[carrierId] = [note, ...existing];
    },
    createCarrierNoteFailure(
      _state,
      _action: PayloadAction<{ carrierId: string; error: string }>,
    ) {
      // error handled via toast
    },
  },
});

export const {
  fetchCarrierNotesRequest,
  fetchCarrierNotesSuccess,
  fetchCarrierNotesFailure,
  createCarrierNoteRequest,
  createCarrierNoteSuccess,
  createCarrierNoteFailure,
} = carrierNotesSlice.actions;

export default carrierNotesSlice.reducer;
