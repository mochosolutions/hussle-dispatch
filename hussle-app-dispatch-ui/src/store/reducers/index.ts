import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from 'features/ui/store/reducers/uiSlice';
import { carrierReducer } from 'features/carrier/store/reducers/carrierEntitySlice';
import { carrierPageSlice } from 'features/carrier/store/reducers/carrierNewPageSlice';
import { vehicleReducer } from 'features/vehicle/store/reducers/vehicleEntitySlice';
import { vehiclePageSlice } from 'features/vehicle/store/reducers/vehiclePageSlice';
import { driverReducer, driverPageReducer } from 'features/driver/store/reducers';
import { authReducer } from 'features/auth/store';

const pages = combineReducers({
  ui: uiReducer,
  carriers: carrierPageSlice.reducer,
  vehicles: vehiclePageSlice.reducer,
  drivers: driverPageReducer,
});

const entities = combineReducers({
  _placeholder: (_state: Record<string, never> = {}) => _state,
  carriers: carrierReducer,
  vehicles: vehicleReducer,
  drivers: driverReducer,
});

const rootReducer = combineReducers({
  pages,
  entities,
  auth: authReducer,
});

export default rootReducer;
