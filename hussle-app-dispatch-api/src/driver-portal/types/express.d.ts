import type { DriverPortalContext } from './driverPortalTypes';

declare global {
  namespace Express {
    interface Request {
      driverPortal?: DriverPortalContext;
    }
  }
}
