import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';
import { formatCognitoUser } from './formatCognitoUser';
import { logger } from '@/shared/utils/logger';

interface IsUserCreatedParams {
  username: string;
  userPoolId: string;
  client: CognitoIdentityProviderClient;
}

export const isUserCreated = async ({
  username,
  userPoolId,
  client,
}: IsUserCreatedParams): Promise<boolean> => {
  const command = new ListUsersCommand({
    UserPoolId: userPoolId,
    Filter: `email = "${username}"`,
  });
  try {
    const response = await client.send(command);
    const users = response.Users || [];

    return users.some((user) => {
      const formattedUser = formatCognitoUser(user);
      return formattedUser.email === username;
    });
  } catch (error: unknown) {
    logger.error('Error checking user in Cognito', { error });
    throw new AuthRequestError('Error checking user in Cognito');
  }
};
