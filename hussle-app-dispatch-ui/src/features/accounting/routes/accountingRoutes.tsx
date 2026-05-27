import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { Loadable } from '@mocho/ui/components';
import AppLayout from 'components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const SettlementListPage = Loadable(lazy(() => import('../pages/SettlementListPage')));
const SettlementDetailPage = Loadable(lazy(() => import('../pages/SettlementDetailPage')));
const IftaReportPage = Loadable(lazy(() => import('../pages/IftaReportPage')));
const ExpenseListPage = Loadable(lazy(() => import('../pages/ExpenseListPage')));

const accountingRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/accounting',
  children: [
    {
      index: true,
      element: <Navigate to="settlements" replace />,
    },
    {
      path: 'settlements',
      element: <SettlementListPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    {
      path: 'settlements/:id',
      element: <SettlementDetailPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    {
      path: 'ifta',
      element: <IftaReportPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
    {
      path: 'expenses',
      element: <ExpenseListPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default accountingRoutes;
