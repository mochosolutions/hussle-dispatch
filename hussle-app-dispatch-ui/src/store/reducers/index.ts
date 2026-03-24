import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from 'features/ui/store/reducers/uiSlice';
import { carrierReducer } from 'features/carrier/store/reducers/carrierEntitySlice';
import { carrierPageSlice } from 'features/carrier/store/reducers/carrierNewPageSlice';
import { vehicleReducer } from 'features/vehicle/store/reducers/vehicleEntitySlice';
import { vehiclePageSlice } from 'features/vehicle/store/reducers/vehiclePageSlice';
import vehicleLoadHistoryReducer from 'features/vehicle/store/reducers/vehicleLoadHistorySlice';
import { driverReducer, driverPageReducer } from 'features/driver/store/reducers';
import { placeReducer } from 'features/place/store/reducers/placeEntitySlice';
import { placePageSlice } from 'features/place/store/reducers/placePageSlice';
import { loadReducer } from 'features/load/store/reducers/loadEntitySlice';
import { loadPageReducer } from 'features/load/store/reducers/loadPageSlice';
import { authReducer } from 'features/auth/store';
import carrierNotesReducer from 'features/carrier/store/reducers/carrierNotesSlice';
import intelPageSlice from 'features/loadintelligence/store/reducers/intelPageSlice';
import { invoicePageSlice } from 'features/invoices/store/reducers/invoicePageSlice';
import { invoiceReducer } from 'features/invoices/store/reducers/invoiceEntitySlice';
import { invoiceCountsReducer } from 'features/invoices/store/reducers/invoiceCountsSlice';
import dashboardReducer from 'features/dashboard/store/reducers/dashboardSlice';
import { contactReducer } from 'features/contact/store/reducers/contactEntitySlice';
import { contactPageSlice } from 'features/contact/store/reducers/contactPageSlice';
import { customerReducer } from 'features/customer/store/reducers/customerEntitySlice';
import { customerPageReducer } from 'features/customer/store/reducers/customerPageSlice';
import { settingsSlice } from 'features/settings/store/reducers/settingsSlice';

const pages = combineReducers({
  ui: uiReducer,
  carriers: carrierPageSlice.reducer,
  carrierNotes: carrierNotesReducer,
  vehicles: vehiclePageSlice.reducer,
  vehicleLoadHistory: vehicleLoadHistoryReducer,
  drivers: driverPageReducer,
  places: placePageSlice.reducer,
  loads: loadPageReducer,
  intel: intelPageSlice.reducer,
  invoices: invoicePageSlice.reducer,
  invoiceCounts: invoiceCountsReducer,
  dashboard: dashboardReducer,
  contacts: contactPageSlice.reducer,
  customers: customerPageReducer,
  settings: settingsSlice.reducer,
});

const entities = combineReducers({
  _placeholder: (_state: Record<string, never> = {}) => _state,
  carriers: carrierReducer,
  vehicles: vehicleReducer,
  drivers: driverReducer,
  places: placeReducer,
  loads: loadReducer,
  contacts: contactReducer,
  invoices: invoiceReducer,
  customers: customerReducer,
});

const rootReducer = combineReducers({
  pages,
  entities,
  auth: authReducer,
});

export default rootReducer;
