import { lazy } from 'react';
import { Loadable } from '@mocho/ui/components';
import AppLayout from '../../../components/AppLayout';
import { PersistLogin, AuthGuard } from 'components/ProtectedRoute';

const ContactListPage = Loadable(lazy(() => import('../pages/ContactListPage')));
const ContactDetailPage = Loadable(lazy(() => import('../pages/ContactDetailPage')));

const contactRoutes = {
  breadcrumbs: false,
  element: (
    <PersistLogin>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </PersistLogin>
  ),
  path: '/contacts',
  children: [
    {
      index: true,
      element: <ContactListPage />,
      handle: { mainContentProps: { container: false, contentPadding: 0 } },
    },
    {
      path: ':id',
      element: <ContactDetailPage />,
      handle: {
        mainContentProps: {
          container: false,
          contentPadding: 0,
        },
      },
    },
  ],
};

export default contactRoutes;
