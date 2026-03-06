import { useSelector } from 'store';
import AuthWrapper from 'features/auth/sections/AuthWrapper';
import AuthFormWrapper from 'features/auth/sections/AuthFormWrapper';
import ResetPasswordForm from 'features/auth/sections/AuthResetPassword';
import { isConfirmPasswordResetErrorSelector } from 'features/auth/store/selectors';

const ResetPassword = () => {
  const hasError = useSelector(isConfirmPasswordResetErrorSelector);
  return (
    <AuthWrapper>
      <AuthFormWrapper
        title="Reset Password"
        subTitle="Please choose your new password"
        error={hasError}
        errorTitle="There seems to be an issue with the credentials you provided"
      >
        <ResetPasswordForm />
      </AuthFormWrapper>
    </AuthWrapper>
  );
};

export default ResetPassword;
