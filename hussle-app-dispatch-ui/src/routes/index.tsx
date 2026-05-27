import { useCallback, useEffect } from 'react';
import { createBrowserRouter, Outlet, useNavigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import ThemeCustomization from '@mocho/ui/theme';
import { useSelector, useDispatch } from 'store';
import { setNavigate } from 'store/middleware/createSagaMiddleware';
import { DrawerManager, ModalManager } from 'mocho/components';
import drawerRegistry from 'features/ui/drawerRegistry';
import modalRegistry from 'features/ui/modalRegistry';
import { currentDrawerSelector } from 'features/ui/store/selectors/drawerSelectors';
import { currentModalSelector } from 'features/ui/store/selectors/modalSelectors';
import { closeDrawer, closeModal } from 'features/ui/store/reducers/uiSlice';
import NotificationShell from 'features/ui/NotificationShell';
import DashboardRoutes from 'features/dashboard/routes/DashboardRoutes';
import LoginRoutes from 'features/auth/routes/LoginRoutes';
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
import CarrierPortalRoutes from 'features/carrier-portal/routes/CarrierPortalRoutes';
import DevRoutes from 'features/dev/routes/devRoutes';
import ErrorPage from 'components/ErrorPage';
import PortalSessionGuard from 'features/auth/components/PortalSessionGuard';
import App from '../App';

const PortalShell = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeDrawer = useSelector(currentDrawerSelector);
  const activeModal = useSelector(currentModalSelector);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  const handleCloseDrawer = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  return (
    <ThemeCustomization>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <NotificationShell>
          <PortalSessionGuard>
            <Outlet />
          </PortalSessionGuard>
          <DrawerManager
            activeDrawer={activeDrawer}
            componentLookup={drawerRegistry}
            onClose={handleCloseDrawer}
          />
          <ModalManager
            activeModal={activeModal}
            componentLookup={modalRegistry}
            onClose={handleCloseModal}
          />
        </NotificationShell>
      </LocalizationProvider>
    </ThemeCustomization>
  );
};

export const routes: RouteObject[] = [
  {
    element: <PortalShell />,
    children: [DriverPortalRoutes, CarrierPortalRoutes],
  },
  {
    element: <App />,
    children: [
      ...DevRoutes,
      LoginRoutes,
      DashboardRoutes,
      LoadRoutes,
      CarrierRoutes,
      VehicleRoutes,
      DriverRoutes,
      PlaceRoutes,
      ContactRoutes,
      CustomerRoutes,
      SettingsRoutes,
      InvoiceRoutes,
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
