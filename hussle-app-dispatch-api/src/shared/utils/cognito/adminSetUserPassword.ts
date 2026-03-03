import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';

export interface AdminSetUserPasswordParams {
  userPoolId: string;
  username: string;
  password: string;
  permanent?: boolean;
  client: CognitoIdentityProviderClient;
}

export const adminSetUserPassword = async ({
  userPoolId,
  username,
  password,
  permanent = true,
  client,
}: AdminSetUserPasswordParams) => {
  const command = new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: username,
    Password: password,
    Permanent: permanent,
  });

  try {
    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error('Error setting user password in Cognito:', error);
    throw new AuthRequestError(`Error setting password for user ${username} in Cognito`);
  }
};
