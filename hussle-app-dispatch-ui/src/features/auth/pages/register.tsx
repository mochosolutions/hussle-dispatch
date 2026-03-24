import { useSelector } from 'store';
import AuthWrapper from 'features/auth/sections/AuthWrapper';
import AuthRegisterForm from 'features/auth/sections/AuthRegister';
import AuthFormWrapper from 'features/auth/sections/AuthFormWrapper';
import { isSignupErrorSelector } from 'features/auth/store/selectors';

const Register = () => {
  const hasError = useSelector(isSignupErrorSelector);

  return (
    <AuthWrapper>
      <AuthFormWrapper
        title="Register an Account"
        subTitle="Enter your details to create an account"
        error={hasError}
        errorTitle="There seems to be an issue with the credentials you provided"
        actionLink={{ label: 'Already have an account? Sign in', to: '/login' }}
      >
        <AuthRegisterForm />
      </AuthFormWrapper>
    </AuthWrapper>
  );
};

export default Register;
