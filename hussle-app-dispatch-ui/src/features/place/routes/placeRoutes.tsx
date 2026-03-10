import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const PlaceListPage = Loadable(lazy(() => import('../pages/PlaceListPage')));
const PlaceDetailPage = Loadable(lazy(() => import('../pages/PlaceDetailPage')));

const placeRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/places',
  children: [
    {
      index: true,
      element: <PlaceListPage />,
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
