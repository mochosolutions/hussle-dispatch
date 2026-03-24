import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';

const DriverPortalPage = Loadable(lazy(() => import('../pages/DriverPortalPage')));

const driverPortalRoutes = {
  path: 'driver-portal/:token',
  element: <DriverPortalPage />,
};

export default driverPortalRoutes;
