import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const RateconImportsIndex = Loadable(
  lazy(() => import('features/ratecon-imports/pages/IndexPage')),
);

const RateconImportRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/ratecons',
  children: [
    {
      index: true,
      element: <RateconImportsIndex />,
      handle: { mainContentProps: { container: false, contentPadding: 0 } },
    },
  ],
};

export default RateconImportRoutes;
