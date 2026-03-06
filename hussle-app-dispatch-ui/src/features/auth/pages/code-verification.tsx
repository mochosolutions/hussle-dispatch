import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSelector } from 'store';
import AuthWrapper from 'features/auth/sections/AuthWrapper';
import AuthFormWrapper from 'features/auth/sections/AuthFormWrapper';
import AuthCodeVerificationForm from 'features/auth/sections/AuthCodeVerification';

import { obfuscatedSignupEmailSelector, isConfirmCodeErrorSelector } from 'features/auth/store/selectors';

const CodeVerification = () => {
  const userEmail = useSelector(obfuscatedSignupEmailSelector);
  const hasError = useSelector(isConfirmCodeErrorSelector);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail) {
      navigate('/login');
    }
  }, [userEmail, navigate]);

  return (
    <AuthWrapper>
      <AuthFormWrapper
        title="Enter Verification Code"
        subTitle="We have sent a verification code to your email."
        error={hasError}
        errorTitle="There seems to be an issue with the credentials you provided"
      >
        <AuthCodeVerificationForm />
      </AuthFormWrapper>
    </AuthWrapper>
  );
};

export default CodeVerification;
