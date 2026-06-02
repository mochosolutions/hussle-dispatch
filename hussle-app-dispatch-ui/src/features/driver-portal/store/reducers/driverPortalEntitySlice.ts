import { createEntityModule } from '@mocho/ui/redux';
import type { DriverPortalLoad } from 'utils/api/driver-portal/driverPortalApi';

// Normalized store for the portal load(s) the driver is working. Keyed by load
// id so a socket-driven refetch upserts in place and the page re-renders.
export const driverPortalEntityModule = createEntityModule<DriverPortalLoad>('driverPortalLoads');

export const driverPortalActions = driverPortalEntityModule.actions;
export const driverPortalReducer = driverPortalEntityModule.reducer;
export const driverPortalSelectors = driverPortalEntityModule.selectors;
