import { createEntityModule } from '@mocho/ui/redux';
import type { LoadListItem } from '../../types';

export const loadEntityModule = createEntityModule<LoadListItem>('loads');
export const loadActions = loadEntityModule.actions;
export const loadReducer = loadEntityModule.reducer;
// Selectors look up state.entities['loads'] — key matches rootReducer registration
export const loadSelectors = loadEntityModule.selectors;
