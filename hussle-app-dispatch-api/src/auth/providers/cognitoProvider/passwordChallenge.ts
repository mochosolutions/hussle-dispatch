import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '@/shared/utils/logger';
import { respondToCognitoPasswordChallenge } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';

interface PasswordChallengeInput {
  username: string;
  newPassword: string;
  session: string;
}

interface PasswordChallengeDeps {
  clientId: string;
  client: CognitoIdentityProviderClient;
  userPoolId: string;
}

export const passwordChallengeCognito = async (
  { username, newPassword, session }: PasswordChallengeInput,
  { clientId, client, userPoolId }: PasswordChallengeDeps
) => {
  try {
    const response = await respondToCognitoPasswordChallenge({
      clientId,
      session,
      newPassword,
      username,
      client,
      userPoolId,
    });
    return response;
  } catch (error) {
    logger.error('Error responding to password challenge', { error });
    throw new AuthRequestError('Failed to respond to password challenge');
  }
};
