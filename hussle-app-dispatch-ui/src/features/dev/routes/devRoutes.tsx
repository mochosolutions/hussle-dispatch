import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ComponentLibrary = lazy(() => import('../pages/ComponentLibrary'));
const DetailLayoutDemo = lazy(() => import('../pages/DetailLayoutDemo'));
const ListLayoutDemo = lazy(() => import('../pages/ListLayoutDemo'));
const EditDrawerDemo = lazy(() => import('../pages/EditDrawerDemo'));

const DevRoutes: RouteObject[] = [
  {
    path: '/component-library',
    element: <ComponentLibrary />,
  },
  {
    path: '/dev/detail-layout',
    element: <DetailLayoutDemo />,
  },
  {
    path: '/dev/list-layout',
    element: <ListLayoutDemo />,
  },
  {
    path: '/dev/edit-drawer',
    element: <EditDrawerDemo />,
  },
];

export default DevRoutes;
