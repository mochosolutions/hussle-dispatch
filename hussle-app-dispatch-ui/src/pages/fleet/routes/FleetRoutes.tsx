import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const CarrierListPage = Loadable(lazy(() => import('pages/fleet/pages/CarrierListPage')));
const CarrierDetailPage = Loadable(lazy(() => import('pages/fleet/pages/CarrierDetailPage')));
const DriversIndexPage = Loadable(lazy(() => import('pages/fleet/pages/DriversIndex')));
const VehicleIndexPage = Loadable(lazy(() => import('pages/fleet/pages/VehiclesIndex')));
const VehicleDetailPage = Loadable(lazy(() => import('pages/fleet/pages/VehicleDetailPage')));
const ContactsIndexPage = Loadable(lazy(() => import('pages/fleet/pages/ContactsIndexPage')));

const FleetRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/fleet',
  children: [
    {
      index: true,
      element: <CarrierListPage />,
    },
    {
      path: 'carriers',
      element: <CarrierListPage />,
    },
    {
      path: 'carriers/:id',
      element: <CarrierDetailPage />,
    },
    {
      path: 'drivers',
      element: <DriversIndexPage />,
    },
    {
      path: 'vehicles',
      element: <VehicleIndexPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    {
      path: 'vehicles/:vehicleId',
      element: <VehicleDetailPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    {
      path: 'contacts',
      element: <ContactsIndexPage />,
    },
  ],
};

export default FleetRoutes;
