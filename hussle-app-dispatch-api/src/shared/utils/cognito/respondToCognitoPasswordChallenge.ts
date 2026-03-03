import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { AdminRespondToAuthChallengeCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { AuthenticateResponse } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';

interface RespondToCognitoPasswordChallengeParams {
  userPoolId: string;
  username: string;
  newPassword: string;
  session: string;
  clientId: string;
  client: CognitoIdentityProviderClient;
}

export const respondToCognitoPasswordChallenge = async ({
  userPoolId,
  username,
  newPassword,
  session,
  clientId,
  client,
}: RespondToCognitoPasswordChallengeParams): Promise<AuthenticateResponse> => {
  try {
    const command = new AdminRespondToAuthChallengeCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      ChallengeName: 'NEW_PASSWORD_REQUIRED' as const,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: newPassword,
      },
      Session: session,
    });

    const response = await client.send(command);
    console.log('response:', response);
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
  } catch (error) {
    console.error('Error responding to Cognito password challenge:', error);
    throw new AuthRequestError('Error responding to Cognito password challenge');
  }
};
