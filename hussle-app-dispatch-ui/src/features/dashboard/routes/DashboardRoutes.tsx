import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
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
    {
      path: 'dashboard',
      element: <Navigate to="/" replace />,
    },
  ],
};

export default DashboardRoutes;
