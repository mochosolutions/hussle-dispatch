import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const DriverListPage = Loadable(lazy(() => import('../pages/DriverListPage')));
const DriverDetailPage = Loadable(lazy(() => import('../pages/DriverDetailPage')));

const driverRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/drivers',
  children: [
    {
      index: true,
      element: <DriverListPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
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
