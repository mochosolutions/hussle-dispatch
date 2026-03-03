import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const DispatchBoard = Loadable(lazy(() => import('pages/dispatchboard/pages')));
const CreateLoadPage = Loadable(lazy(() => import('../pages/CreateLoadPage')));

const DispatchBoardRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/dispatch-board',
  children: [
    {
      index: true,
      element: <DispatchBoard />,
    },
    {
      path: 'create-load',
      element: <CreateLoadPage />,
    },
  ],
};

export default DispatchBoardRoutes;
