import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const CustomerListPage = Loadable(lazy(() => import('../pages/CustomerListPage')));
const CreateCustomerPage = Loadable(lazy(() => import('../pages/CreateCustomerPage')));
const CustomerDetailPage = Loadable(lazy(() => import('../pages/CustomerDetailPage')));

const customerRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/customers',
  children: [
    {
      index: true,
      element: <CustomerListPage />,
      handle: { mainContentProps: { container: false, contentPadding: 0 } },
    },
    {
      path: 'create',
      element: <CreateCustomerPage />,
    },
    {
      path: ':id',
      element: <CustomerDetailPage />,
      handle: { mainContentProps: { container: false, contentPadding: 0 } },
    },
  ],
};

export default customerRoutes;
