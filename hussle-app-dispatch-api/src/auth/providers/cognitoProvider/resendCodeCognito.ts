import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '@/shared/utils/logger';
import { resendConfirmationCodeCognito } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';

interface ResendCodeInput {
  username: string;
}

interface ResendCodeDeps {
  clientId: string;
  client: CognitoIdentityProviderClient;
}

export const resendCodeCognito = async (
  { username }: ResendCodeInput,
  { clientId, client }: ResendCodeDeps
) => {
  try {
    const response = await resendConfirmationCodeCognito({
      clientId,
      username,
      client,
    });
    return { success: true, message: 'Resend code sent' };
  } catch (error) {
    logger.error('Error in resendCodeCognito', { error });
    throw new AuthRequestError('Failed to resend confirmation code');
  }
};
