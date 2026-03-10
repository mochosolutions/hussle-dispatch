export {
  vehiclePageSlice,
  vehiclePageSelectors,
  fetchVehiclesRequest,
  fetchVehiclesSuccess,
  fetchVehiclesFailure,
  fetchVehicleDetailsRequest,
  fetchVehicleDetailsSuccess,
  fetchVehicleDetailsFailure,
  createVehicleRequest,
  createVehicleSuccess,
  createVehicleFailure,
  updateVehicleRequest,
  updateVehicleSuccess,
  updateVehicleFailure,
  deleteVehicleRequest,
  deleteVehicleSuccess,
  deleteVehicleFailure,
  assignDriverRequest,
  unassignDriverRequest,
} from './vehiclePageSlice';

export {
  vehicleEntityModule,
  vehicleActions,
  vehicleReducer,
  vehicleSelectors,
} from './vehicleEntitySlice';
