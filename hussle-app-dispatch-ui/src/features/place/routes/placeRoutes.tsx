import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const PlaceListPage = Loadable(lazy(() => import('../pages/PlaceListPage')));
const PlaceDetailPage = Loadable(lazy(() => import('../pages/PlaceDetailPage')));

const placeRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/places',
  children: [
    {
      index: true,
      element: <PlaceListPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    {
      path: ':id',
      element: <PlaceDetailPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default placeRoutes;
