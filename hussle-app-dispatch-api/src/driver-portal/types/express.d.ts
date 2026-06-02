import type { DriverPortalContext } from './driverPortalTypes';

declare global {
  namespace Express {
    interface Request {
      driverPortal?: DriverPortalContext;
      // Set by authenticateDriverSession: the Driver.id resolved from the
      // authenticated DRIVER user's session (Driver.userId === req.user.userId).
      driverId?: string;
    }
  }
}
