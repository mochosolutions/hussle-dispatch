import { authHandlers } from './authHandlers';
import { carrierHandlers } from './carrierHandlers';
import { driverHandlers } from './driverHandlers';
import { vehicleHandlers } from './vehicleHandlers';
import { contactHandlers } from './contactHandlers';
import { loadHandlers } from './loadHandlers';
import { placeHandlers } from './placeHandlers';
import { dashboardHandlers } from './dashboardHandlers';
import { invoiceHandlers } from './invoiceHandlers';
import { documentHandlers } from './documentHandlers';
import { customerHandlers } from './customerHandlers';
import { settingsHandlers } from './settingsHandlers';
import { loadIntelHandlers } from './loadIntelHandlers';
import { notificationHandlers } from './notificationHandlers';
import { driverPortalHandlers } from './driverPortalHandlers';

export const handlers = [
  ...authHandlers,
  ...carrierHandlers,
  ...driverHandlers,
  ...vehicleHandlers,
  ...contactHandlers,
  ...loadHandlers,
  ...placeHandlers,
  ...dashboardHandlers,
  ...invoiceHandlers,
  ...documentHandlers,
  ...customerHandlers,
  ...settingsHandlers,
  ...loadIntelHandlers,
  ...notificationHandlers,
  ...driverPortalHandlers,
];
