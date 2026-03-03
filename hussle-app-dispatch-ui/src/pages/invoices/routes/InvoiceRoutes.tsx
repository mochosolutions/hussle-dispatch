import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';

const InvoiceIndex = Loadable(lazy(() => import('pages/invoices/pages')));
const InvoiceDetailPage = Loadable(lazy(() => import('pages/invoices/pages/InvoiceDetailPage')));

const InvoiceRoutes = {
  breadcrumbs: false,
  element: <AppLayout />,
  path: '/invoices',
  children: [
    {
      index: true,
      element: <InvoiceIndex />,
    },
    {
      path: ':invoiceId',
      element: <InvoiceDetailPage />,
    },
  ],
};

export default InvoiceRoutes;
