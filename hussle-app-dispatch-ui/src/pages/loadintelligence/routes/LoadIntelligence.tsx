import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const LoadIntelligence = Loadable(lazy(() => import('pages/loadintelligence/pages')));

const LoadIntelligenceRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/load-intelligence',
  children: [
    {
      index: true,
      element: <LoadIntelligence />,
    },
  ],
};

export default LoadIntelligenceRoutes;
