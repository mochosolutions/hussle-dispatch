import type { RouteObject } from 'react-router-dom';
import AppLayout from '../../../components/AppLayout';
import HomePage from '../pages/HomePage';

const HomeRoutes: RouteObject[] = [
  {
    element: <AppLayout />,
    path: '/',
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
];

export default HomeRoutes;
