import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from 'pages/ui/store/uiSlice';
import carrierPageReducer from 'pages/fleet/store/reducers/carrierPageSlice';
import { carrierReducer } from 'pages/fleet/store/reducers/carrierEntitySlice';

const pages = combineReducers({
  ui: uiReducer,
  carrierPage: carrierPageReducer,
});

const entities = combineReducers({
  _placeholder: (_state: Record<string, never> = {}) => _state,
  carriers: carrierReducer,
});

const rootReducer = combineReducers({
  pages,
  entities,
});

export default rootReducer;
