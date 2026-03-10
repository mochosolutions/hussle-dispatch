import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from 'features/ui/store/reducers/uiSlice';
import { carrierReducer } from 'features/carrier/store/reducers/carrierEntitySlice';
import { carrierPageSlice } from 'features/carrier/store/reducers/carrierNewPageSlice';
import { vehicleReducer } from 'features/vehicle/store/reducers/vehicleEntitySlice';
import { vehiclePageSlice } from 'features/vehicle/store/reducers/vehiclePageSlice';
import { driverReducer, driverPageReducer } from 'features/driver/store/reducers';
import { placeReducer } from 'features/place/store/reducers/placeEntitySlice';
import { placePageSlice } from 'features/place/store/reducers/placePageSlice';
import { loadReducer } from 'features/load/store/reducers/loadEntitySlice';
import { loadPageSlice } from 'features/load/store/reducers/loadPageSlice';
import { authReducer } from 'features/auth/store';
import carrierNotesReducer from 'features/carrier/store/reducers/carrierNotesSlice';
import intelPageSlice from 'features/loadintelligence/store/reducers/intelPageSlice';
import { invoicePageSlice } from 'features/invoices/store/reducers/invoicePageSlice';
import { invoiceReducer } from 'features/invoices/store/reducers/invoiceEntitySlice';
import dashboardReducer from 'features/dashboard/store/reducers/dashboardSlice';

const pages = combineReducers({
  ui: uiReducer,
  carriers: carrierPageSlice.reducer,
  carrierNotes: carrierNotesReducer,
  vehicles: vehiclePageSlice.reducer,
  drivers: driverPageReducer,
  places: placePageSlice.reducer,
  loads: loadPageSlice.reducer,
  intel: intelPageSlice.reducer,
  invoices: invoicePageSlice.reducer,
  dashboard: dashboardReducer,
});

const entities = combineReducers({
  _placeholder: (_state: Record<string, never> = {}) => _state,
  carriers: carrierReducer,
  vehicles: vehicleReducer,
  drivers: driverReducer,
  places: placeReducer,
  loads: loadReducer,
  invoices: invoiceReducer,
});

const rootReducer = combineReducers({
  pages,
  entities,
  auth: authReducer,
});

export default rootReducer;
