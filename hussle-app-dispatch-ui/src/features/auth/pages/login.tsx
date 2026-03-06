import { useSelector } from 'store';
import AuthWrapper from 'features/auth/sections/AuthWrapper';
import AuthLogin from 'features/auth/sections/AuthLogin';
import AuthFormWrapper from 'features/auth/sections/AuthFormWrapper';
import { loginPageErrorSelector } from 'features/auth/store/selectors';

const Login = () => {
  const loginPageRequestHasErrors = useSelector(loginPageErrorSelector);

  return (
    <AuthWrapper>
      <AuthFormWrapper
        title="Login"
        subTitle="Enter your email and password to login"
        error={loginPageRequestHasErrors}
        errorTitle="There seems to be an issue with the credentials you provided"
      >
        <AuthLogin />
      </AuthFormWrapper>
    </AuthWrapper>
  );
};

export default Login;
