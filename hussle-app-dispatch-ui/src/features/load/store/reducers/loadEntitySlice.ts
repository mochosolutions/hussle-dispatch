import { createEntityModule } from '@mocho/ui/redux';
import type { LoadDetail, LoadListItem } from '../../types';

// Entity store holds the canonical Load shape — list items hydrate as
// LoadListItem, fetchLoadDetailSaga upserts the wider LoadDetail. The
// nested shapes are aligned so the EntityAdapter shallow merge is safe.
export const loadEntityModule = createEntityModule<LoadListItem | LoadDetail>('loads');
export const loadActions = loadEntityModule.actions;
export const loadReducer = loadEntityModule.reducer;
// Selectors look up state.entities['loads'] — key matches rootReducer registration
export const loadSelectors = loadEntityModule.selectors;
