import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { ListGroupsCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

interface IsGroupCreatedParams {
  groupName: string;
  userPoolId: string;
  client: CognitoIdentityProviderClient;
}

export const isGroupCreated = async ({
  groupName,
  userPoolId,
  client,
}: IsGroupCreatedParams): Promise<boolean> => {
  const command = new ListGroupsCommand({
    UserPoolId: userPoolId,
  });

  try {
    const response = await client.send(command);
    const groups = response.Groups || [];
    return groups.some((group) => group.GroupName === groupName);
  } catch (error: unknown) {
    logger.error('Error checking group in Cognito', { error });
    throw new AuthRequestError('Error checking group in Cognito');
  }
};
