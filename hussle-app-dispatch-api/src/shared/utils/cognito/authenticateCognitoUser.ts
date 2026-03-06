import { InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { AuthenticateResponse, AuthenticateCognitoUserParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

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
    logger.debug('cognito InitiateAuthCommand response received');
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
  } catch (error: unknown) {
    logger.error('Error authenticating user', { error });

    if (error instanceof Error && error.name === 'UserNotConfirmedException') {
      return {
        challengeName: 'UNCONFIRMED',
      };
    }
    throw new AuthRequestError('Error authenticating user');
  }
};
