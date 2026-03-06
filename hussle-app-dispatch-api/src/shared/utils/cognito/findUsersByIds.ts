import type {
  CognitoIdentityProviderClient,
  UserType,
  ListUsersCommandInput,
  ListUsersCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { formatCognitoUser as FormatCognitoUserFn } from './formatCognitoUser';
import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';

interface FindUsersByIdsParams {
  ids: string[];
  userPoolId: string;
  client: CognitoIdentityProviderClient;
  formatCognitoUser: typeof FormatCognitoUserFn;
}

export const findUsersByIds = async ({
  ids,
  userPoolId,
  client,
  formatCognitoUser,
}: FindUsersByIdsParams) => {
  try {
    let users: UserType[] = [];

    for (const id of ids) {
      const filter = `sub = "${id}"`;
      let paginationToken; // For handling pagination if there are many users

      do {
        const params: ListUsersCommandInput = {
          UserPoolId: userPoolId,
          Filter: filter,
          PaginationToken: paginationToken,
        };

        const command = new ListUsersCommand(params);
        const response: ListUsersCommandOutput = await client.send(command);

        if (response.Users) {
          users = users.concat(response.Users);
        }
        // Update the pagination token for the next iteration (if present)
        paginationToken = response.PaginationToken;
      } while (paginationToken);
    }

    return users.map((user) => formatCognitoUser(user));
  } catch (error: unknown) {
    logger.error('Error retrieving users by IDs', { error });
    throw new AuthRequestError('Error retrieving users by IDs');
  }
};
