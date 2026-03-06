import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from 'features/ui/store/reducers/uiSlice';
import carrierPageReducer from 'features/carrier/store/reducers/carrierPageSlice';
import { carrierReducer } from 'features/carrier/store/reducers/carrierEntitySlice';
import { carrierPageSlice } from 'features/carrier/store/reducers/carrierNewPageSlice';
import { authReducer } from 'features/auth/store';

const pages = combineReducers({
  ui: uiReducer,
  carrierPage: carrierPageReducer,
  carriers: carrierPageSlice.reducer,
});

const entities = combineReducers({
  _placeholder: (_state: Record<string, never> = {}) => _state,
  carriers: carrierReducer,
});

const rootReducer = combineReducers({
  pages,
  entities,
  auth: authReducer,
});

export default rootReducer;
