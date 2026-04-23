import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';

const adapter = createEntityAdapter<SmsPromptScheduleResponse>({
  sortComparer: (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
});

const smsPromptEntitySlice = createSlice({
  name: 'smsPrompts',
  initialState: adapter.getInitialState(),
  reducers: {
    upsertMany: adapter.upsertMany,
    setAll: adapter.setAll,
    clear: adapter.removeAll,
  },
});

export const smsPromptEntityActions = smsPromptEntitySlice.actions;

export const smsPromptEntitySelectors = adapter.getSelectors<RootState>(
  (state) => state.entities.smsPrompts,
);

export const smsPromptEntityReducer = smsPromptEntitySlice.reducer;
export default smsPromptEntitySlice.reducer;
