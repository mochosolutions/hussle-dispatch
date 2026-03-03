import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { UpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';

interface UpdateUserAttributesParams {
  accessToken: string;
  userAttributes: { Name: string; Value: string }[];
  client: CognitoIdentityProviderClient;
}

export const updateUserAttributes = async ({
  accessToken,
  userAttributes,
  client,
}: UpdateUserAttributesParams) => {
  try {
    const command = new UpdateUserAttributesCommand({
      AccessToken: accessToken,
      UserAttributes: userAttributes,
    });
    const response = await client.send(command);
    return response;
  } catch (error) {
    throw new AuthRequestError(`Error updating user attributes for user`);
  }
};
