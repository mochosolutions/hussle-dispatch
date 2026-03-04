import { createEntityModule } from '@mocho/ui/redux';
import type { CarrierListItem } from '../../types';

// Entity module stores CarrierListItem so list pages can render all columns.
// When a plain Carrier is stored (e.g. from detail fetch), the list-only fields
// (driverCount, vehicleCount, onboardingComplete) should be provided with defaults.
export const carrierEntityModule = createEntityModule<CarrierListItem>('carriers');
export const carrierActions = carrierEntityModule.actions;
export const carrierReducer = carrierEntityModule.reducer;
// Selectors look up state.entities['carriers'] — key matches rootReducer registration
export const carrierSelectors = carrierEntityModule.selectors;
