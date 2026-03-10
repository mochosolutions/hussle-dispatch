import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const DispatchBoardPage = Loadable(lazy(() => import('../pages/DispatchBoardPage')));
const CreateLoadPage = Loadable(lazy(() => import('../pages/CreateLoadPage')));
const LoadDetailPage = Loadable(lazy(() => import('../pages/LoadDetailPage')));

const loadRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/loads',
  children: [
    {
      index: true,
      element: <DispatchBoardPage />,
    },
    {
      path: 'new',
      element: <CreateLoadPage />,
    },
    {
      path: ':id',
      element: <LoadDetailPage />,
    },
  ],
};

export default loadRoutes;
