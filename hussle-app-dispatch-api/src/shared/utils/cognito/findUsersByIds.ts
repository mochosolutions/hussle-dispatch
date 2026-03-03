import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthRequestError } from '@/shared/errors/authError';

interface FindUsersByIdsParams {
  ids: string[];
  userPoolId: string;
  client: CognitoIdentityProviderClient;
  formatCognitoUser: (user: any) => any; // Function to format the user object
}

export const findUsersByIds = async ({
  ids,
  userPoolId,
  client,
  formatCognitoUser,
}: FindUsersByIdsParams) => {
  try {
    let users: any[] = [];

    for (const id of ids) {
      const filter = `sub = "${id}"`;
      let paginationToken; // For handling pagination if there are many users

      do {
        const params: any = {
          UserPoolId: userPoolId,
          Filter: filter,
          PaginationToken: paginationToken,
        };

        const command = new ListUsersCommand(params);
        const response = await client.send(command);

        if (response.Users) {
          users = users.concat(response.Users);
        }
        // Update the pagination token for the next iteration (if present)
        paginationToken = response.PaginationToken;
      } while (paginationToken);
    }

    return users.map((user) => formatCognitoUser(user));
  } catch (error) {
    console.error('Error retrieving users by IDs:', error);
    throw new AuthRequestError('Error retrieving users by IDs');
  }
};
