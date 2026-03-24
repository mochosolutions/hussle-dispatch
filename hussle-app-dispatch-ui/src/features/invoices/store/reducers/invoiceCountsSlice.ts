import { createSlice } from '@reduxjs/toolkit';
import type { InvoiceCounts } from '../../types';
import { fetchCountsSuccess } from './invoicePageSlice';

interface InvoiceCountsState {
  counts: InvoiceCounts | null;
}

const initialState: InvoiceCountsState = {
  counts: null,
};

export const invoiceCountsSlice = createSlice({
  name: 'invoiceCounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCountsSuccess, (state, action) => {
      state.counts = action.payload.counts;
    });
  },
});

export const invoiceCountsReducer = invoiceCountsSlice.reducer;
