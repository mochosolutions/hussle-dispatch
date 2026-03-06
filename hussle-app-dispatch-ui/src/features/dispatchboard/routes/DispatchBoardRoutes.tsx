import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const DispatchBoard = Loadable(lazy(() => import('features/dispatchboard/pages')));
const CreateLoadPage = Loadable(lazy(() => import('features/dispatchboard/pages/CreateLoadPage')));

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
