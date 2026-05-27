import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const LoadIntelligence = Loadable(lazy(() => import('features/loadintelligence/pages')));

const LoadIntelligenceRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/load-intelligence',
  children: [
    {
      index: true,
      element: <LoadIntelligence />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default LoadIntelligenceRoutes;
