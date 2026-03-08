import { createEntityModule } from '@mocho/ui/redux';
import type { Vehicle } from 'features/carrier/types';

export const vehicleEntityModule = createEntityModule<Vehicle>('vehicles');
export const vehicleActions = vehicleEntityModule.actions;
export const vehicleReducer = vehicleEntityModule.reducer;
export const vehicleSelectors = vehicleEntityModule.selectors;
