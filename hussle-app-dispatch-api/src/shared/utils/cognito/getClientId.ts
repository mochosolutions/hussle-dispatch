export const getClientId = async () => {
  const clientId = process.env.COGNITO_CLIENT_ID || '';
  const userpoolId = process.env.COGNITO_USER_POOL_ID || '';

  return {
    clientId,
    userPoolId: userpoolId,
  };
};
