import type { CarrierPortalContext } from './carrierPortalTypes';

declare global {
  namespace Express {
    interface Request {
      carrierPortal?: CarrierPortalContext;
    }
  }
}
