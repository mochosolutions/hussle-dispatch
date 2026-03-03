import type {
  CognitoIdentityProviderClient,
  ForgotPasswordCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';

interface ConfirmForgotPasswordParams {
  clientId: string;
  username: string;
  confirmationCode: string;
  newPassword: string;
  client: CognitoIdentityProviderClient;
}

export const confirmForgotPasswordCognito = async ({
  clientId,
  username,
  confirmationCode,
  newPassword,
  client,
}: ConfirmForgotPasswordParams): Promise<ForgotPasswordCommandOutput> => {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    });
    const response = await client.send(command);
    return response;
  } catch (error) {
    throw new AuthRequestError(`Error confirming password reset for user ${username}`);
  }
};
