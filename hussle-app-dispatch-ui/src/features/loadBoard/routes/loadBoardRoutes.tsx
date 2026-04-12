import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';

import AppLayout from 'components/AppLayout';
import { AuthGuard, PersistLogin } from 'components/ProtectedRoute';

const LoadBoardPage = Loadable(lazy(() => import('features/loadBoard/pages')));

const LoadBoardRoutes = {
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/loadboard',
  children: [
    {
      index: true,
      element: <LoadBoardPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default LoadBoardRoutes;
