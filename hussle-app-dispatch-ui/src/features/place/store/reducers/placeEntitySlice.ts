import { createEntityModule } from '@mocho/ui/redux';
import type { Place } from '../../types';

export const placeEntityModule = createEntityModule<Place>('places');
export const placeActions = placeEntityModule.actions;
export const placeReducer = placeEntityModule.reducer;
export const placeSelectors = placeEntityModule.selectors;
