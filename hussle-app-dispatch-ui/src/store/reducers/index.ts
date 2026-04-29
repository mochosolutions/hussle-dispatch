import { combineReducers } from '@reduxjs/toolkit';
import type { AnyAction } from '@reduxjs/toolkit';
import { logoutSuccess } from 'features/auth/store/authSlice';
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
import { smsPromptEntityReducer } from 'features/load/store/reducers/smsPromptEntitySlice';
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
import { teamReducer } from 'features/settings/store/reducers/teamSlice';
import { settingsEntityReducer } from 'features/settings/store/reducers/settingsEntitySlice';
import { teamEntityReducer } from 'features/settings/store/reducers/teamEntitySlice';
import { documentReducer } from 'features/documents/store/reducers/documentEntitySlice';
import documentPageReducer from 'features/documents/store/reducers/documentPageSlice';
import { carrierPortalReducer } from 'features/carrier-portal/store/slices/carrierPortalSlice';
import { settlementReducer } from 'features/accounting/store/reducers/settlementEntitySlice';
import { settlementPageReducer } from 'features/accounting/store/reducers/settlementPageSlice';
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
  team: teamReducer,
  documents: documentPageReducer,
  carrierPortal: carrierPortalReducer,
  settlements: settlementPageReducer,
});

const entities = combineReducers({
  _placeholder: (_state: Record<string, never> = {}) => _state,
  carriers: carrierReducer,
  vehicles: vehicleReducer,
  drivers: driverReducer,
  places: placeReducer,
  loads: loadReducer,
  smsPrompts: smsPromptEntityReducer,
  contacts: contactReducer,
  invoices: invoiceReducer,
  customers: customerReducer,
  documents: documentReducer,
  settlements: settlementReducer,
  orgSettings: settingsEntityReducer,
  teamMembers: teamEntityReducer,
});

const appReducer = combineReducers({
  pages,
  entities,
  auth: authReducer,
});

type AppState = ReturnType<typeof appReducer>;

const rootReducer = (state: AppState | undefined, action: AnyAction): AppState => {
  if (action.type === logoutSuccess.type) {
    // Reset the entire store on logout. Each slice returns its initialState when
    // called with undefined. Auth handles the logoutSuccess action normally via
    // logoutReducer (sets isLoggedIn: false, clears user). Entity + page state is
    // wiped atomically before the next render — no stale data between sessions.
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export default rootReducer;
