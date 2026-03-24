import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const VehicleListPage = Loadable(lazy(() => import('../pages/VehicleListPage')));
const VehicleDetailPage = Loadable(lazy(() => import('../pages/VehicleDetailPage')));

const vehicleRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/vehicles',
  children: [
    {
      index: true,
      element: <VehicleListPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
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
