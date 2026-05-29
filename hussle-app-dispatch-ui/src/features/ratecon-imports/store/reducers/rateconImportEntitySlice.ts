import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import type { RateconImport } from 'utils/api/ratecon-imports';

const adapter = createEntityAdapter<RateconImport>({
  sortComparer: (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
});

const rateconImportEntitySlice = createSlice({
  name: 'rateconImports',
  initialState: adapter.getInitialState(),
  reducers: {
    setAll: adapter.setAll,
    upsertMany: adapter.upsertMany,
    upsertOne: adapter.upsertOne,
    removeOne: adapter.removeOne,
    clear: adapter.removeAll,
  },
});

export const rateconImportEntityActions = rateconImportEntitySlice.actions;

export const rateconImportEntitySelectors = adapter.getSelectors<RootState>(
  (state) => state.entities.rateconImports,
);

export const rateconImportEntityReducer = rateconImportEntitySlice.reducer;
export default rateconImportEntitySlice.reducer;
