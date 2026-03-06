import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

interface ResendConfirmationCodeCognitoParams {
  clientId: string;
  username: string;
  client: CognitoIdentityProviderClient;
}

export const resendConfirmationCodeCognito = async ({
  clientId,
  username,
  client,
}: ResendConfirmationCodeCognitoParams) => {
  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: clientId,
      Username: username,
    });
    const response = await client.send(command);
    return response;
  } catch (error: unknown) {
    logger.error('Error resending confirmation code', { error });
    throw new AuthRequestError(`Error resending confirmation code to user ${username}`);
  }
};
