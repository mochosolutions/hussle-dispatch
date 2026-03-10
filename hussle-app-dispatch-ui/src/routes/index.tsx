import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import DashboardRoutes from 'features/dashboard/routes/DashboardRoutes';
import LoginRoutes from 'features/auth/routes/LoginRoutes';
import DispatchBoardRoutes from 'features/dispatchboard/routes/DispatchBoardRoutes';
// import FleetRoutes from 'pages/fleet/routes/FleetRoutes';
import CarrierRoutes from 'features/carrier/routes/carrierRoutes';
import VehicleRoutes from 'features/vehicle/routes/vehicleRoutes';
import DriverRoutes from 'features/driver/routes/driverRoutes';
import InvoiceRoutes from 'features/invoices/routes/InvoiceRoutes';
import LoadIntelligenceRoutes from 'features/loadintelligence/routes/LoadIntelligence';
import PlaceRoutes from 'features/place/routes/placeRoutes';
import LoadRoutes from 'features/load/routes/loadRoutes';
import App from '../App';
export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      LoginRoutes,
      DashboardRoutes,
      DispatchBoardRoutes,
      LoadRoutes,
      // FleetRoutes,
      CarrierRoutes,
      VehicleRoutes,
      DriverRoutes,
      InvoiceRoutes,
      LoadIntelligenceRoutes,
      PlaceRoutes,

      // {
      //   path: '*',
      //   element: <ErrorPage />,
      // },
    ],
  },
];

const router = createBrowserRouter(routes, {
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_relativeSplatPath: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export default router;
