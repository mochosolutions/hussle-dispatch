import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';

interface GetUserAttributesParams {
  accessToken: string;
  client: CognitoIdentityProviderClient;
}

export const getUserAttributes = async ({ accessToken, client }: GetUserAttributesParams) => {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });
    const response = await client.send(command);
    console.log('User attributes retrieved successfully');
    return response.UserAttributes;
  } catch (error) {
    console.error('Error retrieving user attributes:', error);
    throw new AuthRequestError('Error retrieving user attributes');
  }
};
