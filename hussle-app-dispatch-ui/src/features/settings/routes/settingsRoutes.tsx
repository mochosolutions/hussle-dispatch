import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const SettingsPage = Loadable(lazy(() => import('../pages/SettingsPage')));

const settingsRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/settings',
  children: [
    {
      index: true,
      element: <SettingsPage />,
    },
  ],
};

export default settingsRoutes;
