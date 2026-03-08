import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const DriverListPage = Loadable(lazy(() => import('../pages/DriverListPage')));
const DriverDetailPage = Loadable(lazy(() => import('../pages/DriverDetailPage')));

const driverRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/drivers',
  children: [
    {
      index: true,
      element: <DriverListPage />,
    },
    {
      path: ':id',
      element: <DriverDetailPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default driverRoutes;
