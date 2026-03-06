import { useSelector } from 'store';
import {
  userSessionSelector,
  forceChangePasswordSelector,
} from 'features/auth/store/selectors';

export const useAuth = () => {
  const userSession = useSelector(userSessionSelector);
  const forceChangePassword = useSelector(forceChangePasswordSelector);
  return { userSession, forceChangePassword };
};
