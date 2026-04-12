import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';

const CarrierPortalPage = Loadable(lazy(() => import('../pages/CarrierPortalPage')));

const carrierPortalRoutes = {
  path: 'carrier-portal/:token',
  element: <CarrierPortalPage />,
};

export default carrierPortalRoutes;
