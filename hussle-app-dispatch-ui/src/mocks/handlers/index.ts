import { authHandlers } from './authHandlers';
import { carrierHandlers } from './carrierHandlers';
import { driverHandlers } from './driverHandlers';
import { vehicleHandlers } from './vehicleHandlers';
import { contactHandlers } from './contactHandlers';

export const handlers = [
  ...authHandlers,
  ...carrierHandlers,
  ...driverHandlers,
  ...vehicleHandlers,
  ...contactHandlers,
];
