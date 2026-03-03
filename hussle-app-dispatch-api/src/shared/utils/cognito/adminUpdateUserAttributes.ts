import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';

interface AdminUpdateUserAttributesParams {
  userPoolId: string;
  username: string;
  userAttributes: { Name: string; Value: string }[];
  client: CognitoIdentityProviderClient;
}

export const adminUpdateUserAttributes = async ({
  userPoolId,
  username,
  userAttributes,
  client,
}: AdminUpdateUserAttributesParams) => {
  try {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: userAttributes,
    });
    const response = await client.send(command);
    console.log(`User attributes updated successfully for user "${username}"`);
    return response;
  } catch (error) {
    console.error(`Error updating user attributes for user "${username}":`, error);
    throw new AuthRequestError(`Error updating user attributes for user "${username}"`);
  }
};
