import {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from 'hooks/useAuth';
import {GuardProps} from 'types/auth';

export const PasswordChangeGuard = ({children}: GuardProps) => {
  const navigate = useNavigate();
  const {userSession, forceChangePassword} = useAuth();

  useEffect(() => {
    if (!forceChangePassword && !userSession) {
      console.log('PasswordChangeGuard navigate:', '/login');
      navigate('/login');
    }
  }, [forceChangePassword, userSession, navigate]);

  return children;
};
