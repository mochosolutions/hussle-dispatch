import type { VehicleTokenContext } from './vehicleTokenTypes';

declare global {
  namespace Express {
    interface Request {
      vehicleExpense?: VehicleTokenContext;
    }
  }
}
