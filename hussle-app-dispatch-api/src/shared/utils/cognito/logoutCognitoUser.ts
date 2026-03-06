import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

interface LogoutCognitoUserParams {
  accessToken: string;
  client: CognitoIdentityProviderClient;
}

export const logoutCognitoUser = async ({ accessToken, client }: LogoutCognitoUserParams) => {
  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });

  try {
    const response = await client.send(command);
    return response;
  } catch (error: unknown) {
    logger.error('Error logging out user', { error });
    throw new AuthRequestError('Error logging out user');
  }
};
