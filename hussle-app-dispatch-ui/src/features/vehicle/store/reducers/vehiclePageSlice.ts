import type { RootState } from 'store';
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
