import { ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { ConfirmCognitoUserParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';

export const confirmCognitoUser = async ({
  clientId,
  username,
  confirmationCode,
  client,
}: ConfirmCognitoUserParams) => {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
    });
    const response = await client.send(command);
    return response;
  } catch {
    throw new AuthRequestError(`Error confirming password for user ${username}`);
  }
};
