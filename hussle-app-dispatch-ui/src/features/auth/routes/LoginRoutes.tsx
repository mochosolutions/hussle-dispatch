import { lazy } from 'react';
import CommonLayout from 'mocho/components/layout/CommonLayout';
import Loadable from 'mocho/components/Loadable';
import { PasswordChangeGuard } from 'features/auth/sections/PasswordChangeGuard';

const AuthLogin = Loadable(lazy(() => import('features/auth/pages/login')));
const AuthRegister = Loadable(lazy(() => import('features/auth/pages/register')));
const AuthForgotPassword = Loadable(lazy(() => import('features/auth/pages/forgot-password')));
const AuthResetPassword = Loadable(lazy(() => import('features/auth/pages/reset-password')));
const AuthCodeVerification = Loadable(lazy(() => import('features/auth/pages/code-verification')));
const AuthChangePassword = Loadable(lazy(() => import('features/auth/pages/force-change-password')));

const LoginRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      element: <CommonLayout />,
      children: [
        {
          path: 'login',
          element: <AuthLogin />,
        },
        {
          path: 'register',
          element: <AuthRegister />,
        },
        {
          path: 'forgot-password',
          element: <AuthForgotPassword />,
        },
        {
          path: 'reset-password',
          element: <AuthResetPassword />,
        },
        {
          path: 'code-verification',
          element: <AuthCodeVerification />,
        },
        {
          path: 'change-password',
          element: (
            <PasswordChangeGuard>
              <AuthChangePassword />
            </PasswordChangeGuard>
          ),
        },
      ],
    },
  ],
};

export default LoginRoutes;
