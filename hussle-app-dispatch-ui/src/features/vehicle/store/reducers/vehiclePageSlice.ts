import type { RootState } from 'store';
import { createAction } from '@reduxjs/toolkit';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';

export const vehiclePageSlice = createCrudSlice({
  name: 'vehicle',
  entityName: 'vehicle',
  entityNamePlural: 'vehicles',
});

export const vehiclePageSelectors = createCrudSelectors<RootState>((state) => state.pages.vehicles);

// Semantic action aliases — match the naming convention used by sagas and barrel exports
export const {
  fetchAllRequest: fetchVehiclesRequest,
  fetchAllSuccess: fetchVehiclesSuccess,
  fetchAllFailure: fetchVehiclesFailure,
  fetchByIdRequest: fetchVehicleDetailsRequest,
  fetchByIdSuccess: fetchVehicleDetailsSuccess,
  fetchByIdFailure: fetchVehicleDetailsFailure,
  createRequest: createVehicleRequest,
  createSuccess: createVehicleSuccess,
  createFailure: createVehicleFailure,
  updateRequest: updateVehicleRequest,
  updateSuccess: updateVehicleSuccess,
  updateFailure: updateVehicleFailure,
  deleteRequest: deleteVehicleRequest,
  deleteSuccess: deleteVehicleSuccess,
  deleteFailure: deleteVehicleFailure,
} = vehiclePageSlice.actions;

// Custom actions for driver assignment
export const assignDriverRequest = createAction<{ vehicleId: string; driverId: string }>(
  'vehicle/assignDriverRequest',
);

export const unassignDriverRequest = createAction<{ vehicleId: string }>(
  'vehicle/unassignDriverRequest',
);
