import { CreateGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { CreateGroupParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';

export const createGroupInCognito = async ({
  groupName,
  userPoolId,
  client,
}: CreateGroupParams) => {
  const command = new CreateGroupCommand({
    GroupName: groupName,
    UserPoolId: userPoolId,
  });

  try {
    const response = await client.send(command);
    console.log('Group created in Cognito:', response);
    return response;
  } catch (error) {
    console.error('Error creating group in Cognito:', error);
    throw new AuthRequestError('Error creating group in Cognito');
  }
};
