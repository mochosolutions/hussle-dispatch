import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const DispatchBoardPage = Loadable(lazy(() => import('../pages/DispatchBoardPage')));
const CreateLoadPage = Loadable(lazy(() => import('../pages/CreateLoadPage')));
const LoadDetailPage = Loadable(lazy(() => import('../pages/LoadDetailPage')));

const loadRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/loads',
  children: [
    {
      index: true,
      element: <DispatchBoardPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    {
      path: 'new',
      element: <CreateLoadPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    // {
    //   path: 'create',
    //   element: <CreateLoadPage />,
    //   handle: {
    //     mainContentProps: {
    //       container: false,
    //       contentPadding: 0,
    //     },
    //   },
    // },
    {
      path: ':id',
      element: <LoadDetailPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default loadRoutes;
