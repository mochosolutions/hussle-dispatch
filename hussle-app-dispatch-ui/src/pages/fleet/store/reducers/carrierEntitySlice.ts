import { createEntityModule } from '@mocho/ui/redux';
import type { Carrier } from '../../types';

export const carrierEntityModule = createEntityModule<Carrier>('carriers');
export const carrierActions = carrierEntityModule.actions;
export const carrierReducer = carrierEntityModule.reducer;
// Selectors look up state.entities['carriers'] — key matches rootReducer registration
export const carrierSelectors = carrierEntityModule.selectors;
