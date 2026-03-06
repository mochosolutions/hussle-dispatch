import type {
  CognitoIdentityProviderClient,
  ForgotPasswordCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

interface ForgotPasswordCognitoParams {
  clientId: string;
  username: string;
  client: CognitoIdentityProviderClient;
}

export const forgotPasswordCognito = async ({
  clientId,
  username,
  client,
}: ForgotPasswordCognitoParams): Promise<ForgotPasswordCommandOutput> => {
  logger.debug('forgotPasswordCognito called', { clientId, username });
  try {
    const command = new ForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
    });
    const response = await client.send(command);
    return response;
  } catch (error: unknown) {
    logger.error('Error initiating password reset', { error });
    throw new AuthRequestError(`Error initiating password reset for user ${username}`);
  }
};
