import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';

interface CreateUserParams {
  clientId: string;
  username: string;
  temporaryPassword: string;
  userAttributes: { Name: string; Value: string }[];
  client: CognitoIdentityProviderClient;
}

export const createUserInCognito = async ({
  clientId,
  username,
  temporaryPassword,
  userAttributes,
  client,
}: CreateUserParams) => {
  const command = new SignUpCommand({
    ClientId: clientId,
    Username: username,
    Password: temporaryPassword,
    UserAttributes: userAttributes,
  });

  try {
    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error('Error signing up user in Cognito:', error);
    throw new AuthRequestError('Error signing up user in Cognito');
  }
};
