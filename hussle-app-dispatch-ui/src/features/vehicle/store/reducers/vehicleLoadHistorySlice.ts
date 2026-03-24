import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { VehicleLoad } from 'utils/api/fleet/vehicleApi';

interface VehicleLoadHistoryState {
  loadsByVehicleId: Record<string, VehicleLoad[]>;
  loading: Record<string, string>;
  errors: Record<string, string>;
}

const initialState: VehicleLoadHistoryState = {
  loadsByVehicleId: {},
  loading: {},
  errors: {},
};

const vehicleLoadHistorySlice = createSlice({
  name: 'vehicleLoadHistory',
  initialState,
  reducers: {
    fetchVehicleLoadHistoryRequest(state, action: PayloadAction<{ vehicleId: string }>) {
      const key = `fetch:${action.payload.vehicleId}`;
      state.loading[key] = 'Pending';
      state.errors[key] = '';
    },
    fetchVehicleLoadHistorySuccess(
      state,
      action: PayloadAction<{ vehicleId: string; loads: VehicleLoad[] }>,
    ) {
      const { vehicleId, loads } = action.payload;
      state.loadsByVehicleId[vehicleId] = loads;
      state.loading[`fetch:${vehicleId}`] = 'Fulfilled';
    },
    fetchVehicleLoadHistoryFailure(
      state,
      action: PayloadAction<{ vehicleId: string; error: string }>,
    ) {
      const { vehicleId, error } = action.payload;
      state.loading[`fetch:${vehicleId}`] = 'Rejected';
      state.errors[`fetch:${vehicleId}`] = error;
    },
  },
});

export const {
  fetchVehicleLoadHistoryRequest,
  fetchVehicleLoadHistorySuccess,
  fetchVehicleLoadHistoryFailure,
} = vehicleLoadHistorySlice.actions;

export default vehicleLoadHistorySlice.reducer;
