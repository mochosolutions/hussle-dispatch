import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';

const DriverPortalPage = Loadable(lazy(() => import('../pages/DriverPortalPage')));
const DriverPortalListPage = Loadable(lazy(() => import('../pages/DriverPortalListPage')));
const DriverSetupPage = Loadable(lazy(() => import('../pages/DriverSetupPage')));

// Portal reads require a DRIVER session cookie plus an explicit loadId (the
// `:loadId` route param or a `?loadId=` query). Returning drivers authenticate
// through the shared universal login (`/login`, which the backend reuses via
// `/auth/login`) — there is no portal-specific login page. New drivers complete
// `setup/:token`, which establishes the session directly.
const driverPortalRoutes = {
  path: 'driver-portal',
  children: [
    { index: true, element: <DriverPortalListPage /> },
    { path: 'setup/:token', element: <DriverSetupPage /> },
    { path: ':loadId', element: <DriverPortalPage /> },
  ],
};

export default driverPortalRoutes;
