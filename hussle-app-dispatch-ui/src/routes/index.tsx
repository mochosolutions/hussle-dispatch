import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import App from '../App';
import HomeRoutes from 'pages/home/routes/HomeRoutes';
import DashboardRoutes from 'pages/dashboard/routes/DashboardRoutes';
import DispatchBoardRoutes from 'pages/dispatchboard/routes/DispatchBoardRoutes';
import FleetRoutes from 'pages/fleet/routes/FleetRoutes';
import InvoiceRoutes from 'pages/invoices/routes/InvoiceRoutes';
import LoadIntelligenceRoutes from 'pages/loadintelligence/routes/LoadIntelligence';

// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <App />,
//     children: [...HomeRoutes],
//   },
// ]);

export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      ...HomeRoutes,
      DashboardRoutes,
      DispatchBoardRoutes,
      FleetRoutes,
      InvoiceRoutes,
      LoadIntelligenceRoutes,
      // {
      //   path: '*',
      //   element: <ErrorPage />,
      // },
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;
