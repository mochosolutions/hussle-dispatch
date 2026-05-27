import { useSelector } from 'store';
import {
  selectIsLoggedIn,
  isInitializedSelector,
  userSessionSelector,
  forceChangePasswordSelector,
} from 'features/auth/store/selectors';

export const useAuth = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isInitializing = useSelector(isInitializedSelector);
  const userSession = useSelector(userSessionSelector);
  const forceChangePassword = useSelector(forceChangePasswordSelector);
  return { userSession, forceChangePassword, isLoggedIn, isInitializing };
};
