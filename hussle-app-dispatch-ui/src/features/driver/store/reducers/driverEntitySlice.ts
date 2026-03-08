import { createEntityModule } from '@mocho/ui/redux';
import type { Driver } from 'features/carrier/types';

export const driverEntityModule = createEntityModule<Driver>('drivers');
export const driverActions = driverEntityModule.actions;
export const driverReducer = driverEntityModule.reducer;
export const driverSelectors = driverEntityModule.selectors;
