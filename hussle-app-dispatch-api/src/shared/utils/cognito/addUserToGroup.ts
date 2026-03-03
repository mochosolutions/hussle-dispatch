import { AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { AddUserToGroupParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';

export const addUserToGroup = async ({
  userPoolId,
  username,
  groupName,
  client,
}: AddUserToGroupParams) => {
  try {
    const addUserToGroupParams = {
      UserPoolId: userPoolId,
      Username: username,
      GroupName: groupName,
    };
    const addUserToGroupCommand = new AdminAddUserToGroupCommand(addUserToGroupParams);
    await client.send(addUserToGroupCommand);
    return {
      username,
      groupName,
    };
  } catch (error) {
    console.error('Error adding user to group', error);
    throw new AuthRequestError('Error adding user to group');
  }
};
