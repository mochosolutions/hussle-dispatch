import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const Dashboard = Loadable(lazy(() => import('features/dashboard/pages')));

const DashboardRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/',
  children: [
    {
      index: true,
      element: <Dashboard />,
    },
  ],
};

export default DashboardRoutes;
