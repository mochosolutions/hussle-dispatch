import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { DeleteUserParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

export const deleteUserFromCognito = async ({ username, client, userPoolId }: DeleteUserParams) => {
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    });
    await client.send(command);
    logger.info(`User deleted successfully from Cognito`, { username });
  } catch (error: unknown) {
    logger.error(`Error deleting user from Cognito`, { username, error });
    throw new AuthRequestError(`Failed to delete user ${username} from Cognito`);
  }
};
