import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import DashboardRoutes from 'features/dashboard/routes/DashboardRoutes';
import LoginRoutes from 'features/auth/routes/LoginRoutes';
// import DispatchBoardRoutes from 'features/dispatchboard/routes/DispatchBoardRoutes';
import CarrierRoutes from 'features/carrier/routes/carrierRoutes';
import VehicleRoutes from 'features/vehicle/routes/vehicleRoutes';
import DriverRoutes from 'features/driver/routes/driverRoutes';
import InvoiceRoutes from 'features/invoices/routes/InvoiceRoutes';
import PlaceRoutes from 'features/place/routes/placeRoutes';
import LoadRoutes from 'features/load/routes/loadRoutes';
import ContactRoutes from 'features/contact/routes/contactRoutes';
import CustomerRoutes from 'features/customer/routes/customerRoutes';
import SettingsRoutes from 'features/settings/routes/settingsRoutes';
import AccountingRoutes from 'features/accounting/routes/accountingRoutes';
import DriverPortalRoutes from 'features/driver-portal/routes/driverPortalRoutes';
import CarrierPortalRoutes from 'features/carrier-portal/routes';
import DevRoutes from 'features/dev/routes/devRoutes';
import ErrorPage from 'components/ErrorPage';
import App from '../App';
export const routes: RouteObject[] = [
  DriverPortalRoutes,
  CarrierPortalRoutes,
  {
    element: <App />,
    children: [
      ...DevRoutes,
      LoginRoutes,
      DashboardRoutes,
      // DispatchBoardRoutes,
      LoadRoutes,
      CarrierRoutes,
      VehicleRoutes,
      DriverRoutes,
      InvoiceRoutes,
      PlaceRoutes,
      ContactRoutes,
      CustomerRoutes,
      SettingsRoutes,
      AccountingRoutes,

      {
        path: '*',
        element: <ErrorPage />,
      },
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
