import type { ReactNode } from 'react';
import React from 'react';
import { useSelector } from 'store';
import { portalSessionExpiredSelector } from '../../store/selectors';
import SessionExpiredPortalScreen from '../SessionExpiredPortalScreen';

interface PortalSessionGuardProps {
  children: ReactNode;
}

export const PortalSessionGuard: React.FC<PortalSessionGuardProps> = ({ children }) => {
  const expired = useSelector(portalSessionExpiredSelector);
  if (expired) {
    return <SessionExpiredPortalScreen />;
  }
  return <>{children}</>;
};

export default PortalSessionGuard;
