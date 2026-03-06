import { useSelector } from 'store';
import AuthWrapper from 'features/auth/sections/AuthWrapper';
import AuthFormWrapper from 'features/auth/sections/AuthFormWrapper';
import ForceChangePasswordForm from 'features/auth/sections/AuthForceChangePassword';
import { forceChangePasswordPageErrorSelector } from 'features/auth/store/selectors';

const ForceChangePassword = () => {
  const hasError = useSelector(forceChangePasswordPageErrorSelector);
  return (
    <AuthWrapper>
      <AuthFormWrapper
        title="Change Password"
        subTitle="Please enter your new password."
        error={hasError}
        errorTitle="There seems to be an issue with the credentials you provided"
      >
        <ForceChangePasswordForm />
      </AuthFormWrapper>
    </AuthWrapper>
  );
};

export default ForceChangePassword;
