import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '@/shared/utils/logger';
import { confirmCognitoUser } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';

export interface ConfirmUserInput {
  username: string;
  confirmationCode: string;
}

export interface ConfirmUserCognitoDeps {
  client: CognitoIdentityProviderClient;
  clientId: string;
}

export const confirmUserCognito = async (
  { username, confirmationCode }: ConfirmUserInput,
  { client, clientId }: ConfirmUserCognitoDeps
) => {
  try {
    const response = await confirmCognitoUser({
      client,
      clientId,
      username,
      confirmationCode,
    });

    if (!response) {
      throw new AuthRequestError('Confirmation failed');
    }

    return {
      success: true,
      message: 'User confirmed successfully',
    };
  } catch (error) {
    logger.error('Error in confirmUserCognito', { error });
    throw new AuthRequestError('Failed to confirm user');
  }
};
