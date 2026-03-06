import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import DashboardRoutes from 'features/dashboard/routes/DashboardRoutes';
import LoginRoutes from 'features/auth/routes/LoginRoutes';
import DispatchBoardRoutes from 'features/dispatchboard/routes/DispatchBoardRoutes';
// import FleetRoutes from 'pages/fleet/routes/FleetRoutes';
import CarrierRoutes from 'features/carrier/routes/carrierRoutes';
import InvoiceRoutes from 'features/invoices/routes/InvoiceRoutes';
import LoadIntelligenceRoutes from 'features/loadintelligence/routes/LoadIntelligence';
import App from '../App';
export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      LoginRoutes,
      DashboardRoutes,
      DispatchBoardRoutes,
      // FleetRoutes,
      CarrierRoutes,
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
