import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from 'hooks/useAuth';
import { useDispatch, useSelector } from 'store';
import { initRequest } from 'features/auth/store/authSlice';
import { initAttemptedSelector } from 'features/auth/store/selectors';
import Loader from '../Loader';

export const PersistLogin = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, isInitializing } = useAuth();
  const initAttempted = useSelector(initAttemptedSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!initAttempted && !isLoggedIn) {
      dispatch(initRequest()); // Trigger initialization on mount
    }
  }, [initAttempted, isLoggedIn, dispatch]);

  if (!initAttempted) {
    return <Loader />; // Show loading spinner while initialization is in progress
  }

  return children; // Render child routes after initialization
};

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, isInitializing } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PersistLogin;
