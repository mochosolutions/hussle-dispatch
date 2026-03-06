import { AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { AdminCreateUserInCognitoParams } from './cognitoTypes';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

export const adminCreateUserInCognito = async ({
  userPoolId,
  username,
  userAttributes,
  messageAction,
  temporaryPassword,
  client,
}: AdminCreateUserInCognitoParams) => {
  const command = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: userAttributes,
    ...(messageAction && { MessageAction: messageAction }),
    ...(temporaryPassword && { TemporaryPassword: temporaryPassword }),
    DesiredDeliveryMediums: ['EMAIL'],
  });

  try {
    const response = await client.send(command);
    return response;
  } catch (error: unknown) {
    logger.error('Error creating user in Cognito', { error });
    throw new AuthRequestError('Error creating user in Cognito');
  }
};
