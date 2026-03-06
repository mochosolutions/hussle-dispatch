import { createEntityModule } from '@mocho/ui/redux';
import type { Driver } from '../../types';

export const driverEntityModule = createEntityModule<Driver>('drivers');
export const driverActions = driverEntityModule.actions;
export const driverReducer = driverEntityModule.reducer;
// Selectors look up state.entities['drivers'] — key matches rootReducer registration
export const driverSelectors = driverEntityModule.selectors;
