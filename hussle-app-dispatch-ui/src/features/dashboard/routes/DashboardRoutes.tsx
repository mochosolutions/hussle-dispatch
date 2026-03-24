import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { Loadable } from '@mocho/ui/components';
import AppLayout from 'components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const Dashboard = Loadable(lazy(() => import('features/dashboard/pages')));

const DashboardRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/',
  children: [
    {
      index: true,
      element: <Dashboard />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    {
      path: 'dashboard',
      element: <Navigate to="/" replace />,
    },
  ],
};

export default DashboardRoutes;
