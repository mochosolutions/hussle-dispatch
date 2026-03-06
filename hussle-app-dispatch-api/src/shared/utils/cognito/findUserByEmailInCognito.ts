import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

interface FindUserByEmailParams {
  email: string;
  userPoolId: string;
  client: CognitoIdentityProviderClient;
}

export const findUserByEmailInCognito = async ({
  email,
  userPoolId,
  client,
}: FindUserByEmailParams) => {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: email, // since email is the username
    });
    const response = await client.send(command);
    return response;
  } catch (error: unknown) {
    logger.error('Error retrieving user by email', { error });
    throw new AuthRequestError('Error retrieving user by email');
  }
};
