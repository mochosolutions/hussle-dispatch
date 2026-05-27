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

export {
  fetchVehicleLoadHistoryRequest,
  fetchVehicleLoadHistorySuccess,
  fetchVehicleLoadHistoryFailure,
} from './vehicleLoadHistorySlice';

export { default as vehicleLoadHistoryReducer } from './vehicleLoadHistorySlice';
