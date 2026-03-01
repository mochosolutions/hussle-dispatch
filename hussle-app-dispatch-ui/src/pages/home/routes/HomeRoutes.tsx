import type { RouteObject } from 'react-router-dom';
import HomePage from '../pages/HomePage';

const HomeRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomePage />,
  },
];

export default HomeRoutes;
