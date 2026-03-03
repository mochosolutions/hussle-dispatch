import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { AuthenticateResponse, AuthenticateCognitoUserParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';

export const authenticateCognitoUser = async ({
  username,
  password,
  clientId,
  client,
}: AuthenticateCognitoUserParams): Promise<AuthenticateResponse | { challengeName: string }> => {
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH' as const,
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const response = await client.send(command);
    console.log('cognito InitiateAuthCommand response:', response);
    return {
      accessToken: response.AuthenticationResult?.AccessToken || '',
      refreshToken: response.AuthenticationResult?.RefreshToken || '',
      idToken: response.AuthenticationResult?.IdToken || '',
      expiresIn: response.AuthenticationResult?.ExpiresIn || 0,
      session: response.Session,
      challengeName: response.ChallengeName ?? '',
      challengeParams: {
        requiredAttributes: response.ChallengeParameters?.requiredAttributes,
        userAttributes: response.ChallengeParameters?.userAttributes,
        userID: response.ChallengeParameters?.USER_ID_FOR_SRP ?? '',
      },
    };
  } catch (error: any) {
    console.log('authenticateCognitoUser error:', error);
    console.log('Error Name:', error.name);

    if (error.name === 'UserNotConfirmedException') {
      return {
        challengeName: 'UNCONFIRMED',
      };
    }
    throw new AuthRequestError('Error authenticating user');
  }
};
