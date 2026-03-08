import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const VehicleListPage = Loadable(lazy(() => import('../pages/VehicleListPage')));
const VehicleDetailPage = Loadable(lazy(() => import('../pages/VehicleDetailPage')));

const vehicleRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/vehicles',
  children: [
    {
      index: true,
      element: <VehicleListPage />,
    },
    {
      path: ':id',
      element: <VehicleDetailPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default vehicleRoutes;
