import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';

interface RefreshCognitoUserTokenParams {
  clientId: string;
  refreshToken: string;
  client: CognitoIdentityProviderClient;
}

export const refreshCognitoUserToken = async ({
  clientId,
  refreshToken,
  client,
}: RefreshCognitoUserTokenParams): Promise<{
  accessToken: string;
  idToken: string;
  refreshToken: string;
}> => {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH' as const,
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });
    const response = await client.send(command);
    return {
      accessToken: response.AuthenticationResult?.AccessToken || '',
      idToken: response.AuthenticationResult?.IdToken || '',
      refreshToken: response.AuthenticationResult?.RefreshToken || refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing user token:', error);
    throw new AuthRequestError('Error refreshing user token');
  }
};
