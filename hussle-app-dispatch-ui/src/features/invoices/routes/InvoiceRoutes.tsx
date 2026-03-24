import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const InvoiceIndex = Loadable(lazy(() => import('features/invoices/pages')));
const InvoiceDetailPage = Loadable(lazy(() => import('features/invoices/pages/InvoiceDetailPage')));
const InvoiceBuilderPage = Loadable(
  lazy(() => import('features/invoices/pages/InvoiceBuilderPage')),
);

const InvoiceRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/invoices',
  children: [
    {
      index: true,
      element: <InvoiceIndex />,
      handle: { mainContentProps: { container: false, contentPadding: 0 } },
    },
    {
      path: 'builder/:loadId',
      element: <InvoiceBuilderPage />,
    },
    {
      path: ':invoiceId',
      element: <InvoiceDetailPage />,
      handle: { mainContentProps: { container: false, contentPadding: 0 } },
    },
  ],
};

export default InvoiceRoutes;
