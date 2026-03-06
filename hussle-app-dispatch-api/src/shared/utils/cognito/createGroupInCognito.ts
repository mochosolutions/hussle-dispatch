import { CreateGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { CreateGroupParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

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
    logger.info('Group created in Cognito');
    return response;
  } catch (error: unknown) {
    logger.error('Error creating group in Cognito', { error });
    throw new AuthRequestError('Error creating group in Cognito');
  }
};
