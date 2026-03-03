import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { DeleteUserParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';

export const deleteUserFromCognito = async ({ username, client, userPoolId }: DeleteUserParams) => {
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    });
    await client.send(command);
    console.log(`User ${username} deleted successfully from Cognito`);
  } catch (error) {
    console.error(`Error deleting user ${username} from Cognito:`, error);
    throw new AuthRequestError(`Failed to delete user ${username} from Cognito`);
  }
};
