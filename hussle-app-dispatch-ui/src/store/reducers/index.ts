import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from 'pages/ui/store/uiSlice';

const pages = combineReducers({
  ui: uiReducer,
});

const entities = combineReducers({
  // Entity slices will be added here
  _placeholder: (_state: Record<string, never> = {}) => _state,
});

const rootReducer = combineReducers({
  pages,
  entities,
});

export default rootReducer;
