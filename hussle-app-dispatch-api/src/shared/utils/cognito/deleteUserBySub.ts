import {
  ListUsersCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type { DeleteUserSubParams, DeleteUserBySubArrayParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';

export async function deleteUserBySub({ subId, userPoolId, client }: DeleteUserSubParams) {
  try {
    // Find the user using a filter on the sub attribute
    const listParams = {
      UserPoolId: userPoolId,
      Filter: `sub = "${subId}"`,
      Limit: 1, // Expecting a single match
    };
    const listCommand = new ListUsersCommand(listParams);
    const listResponse = await client.send(listCommand);

    if (listResponse.Users && listResponse.Users.length > 0) {
      const user = listResponse.Users[0];
      if (!user) {
        throw new AuthRequestError(`User with sub ${subId} not found in response`);
      }
      const username = user.Username;
      const deleteParams = {
        UserPoolId: userPoolId,
        Username: username,
      };
      console.log('Delete Params:', deleteParams);
      console.log('Deleting user list response...', listResponse);
      const deleteCommand = new AdminDeleteUserCommand(deleteParams);
      await client.send(deleteCommand);
      console.log(`Deleted user with sub ${subId} (username: ${username}).`);
    } else {
      console.error(`User with sub ${subId} not found.`);
    }
  } catch (error) {
    console.error(`Error deleting user with sub ${subId}:`, error);
    throw new AuthRequestError(`Error deleting user with sub ${subId}`);
  }
}

export async function deleteUsersBySubArray({
  subsArray,
  userPoolId,
  client,
}: DeleteUserBySubArrayParams): Promise<{ subId: string; success: boolean; error?: string }[]> {
  return Promise.all(
    subsArray.map(async (subId) => {
      try {
        await deleteUserBySub({ subId, userPoolId, client });
        return { subId, success: true };
      } catch (error: any) {
        return { subId, success: false, error: error.message };
      }
    })
  );
}
