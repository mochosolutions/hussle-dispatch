import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const CarrierIndexPage = Loadable(lazy(() => import('../pages/CarrierIndex')));
const CarrierListPage = Loadable(lazy(() => import('../pages/CarrierListPage')));
const CreateCarrierPage = Loadable(lazy(() => import('../pages/CreateCarrierPage')));
const CarrierDetailPage = Loadable(lazy(() => import('features/carrier/pages/CarrierDetailPage')));

const carrierRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/carriers',
  children: [
    {
      index: true,
      element: <CarrierIndexPage />,
    },
    {
      path: 'old',
      element: <CarrierIndexPage />,
    },
    {
      path: 'new',
      element: <CarrierListPage />,
    },
    {
      path: 'create',
      element: <CreateCarrierPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },

    {
      path: ':id',
      element: <CarrierDetailPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default carrierRoutes;
