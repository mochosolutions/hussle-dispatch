import { useSelector } from 'store';
import AuthWrapper from 'features/auth/sections/AuthWrapper';
import AuthForgotPasswordForm from 'features/auth/sections/AuthForgotPassword';
import AuthFormWrapper from 'features/auth/sections/AuthFormWrapper';
import { isInitatePassResetErrorSelector } from 'features/auth/store/selectors';

const ForgotPassword = () => {
  const hasError = useSelector(isInitatePassResetErrorSelector);
  return (
    <AuthWrapper>
      <AuthFormWrapper
        title="Forgot Password"
        actionLink={{ label: 'Back to Login', to: '/login' }}
        error={hasError}
        errorTitle="There seems to be an issue with the credentials you provided"
        subTitle="Enter your email address and we will send you a link to reset your password"
      >
        <AuthForgotPasswordForm />
      </AuthFormWrapper>
    </AuthWrapper>
  );
};

export default ForgotPassword;
