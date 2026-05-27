import { logger } from '@/shared/utils/logger';
import {
  adminCreateUserInCognito,
  adminSetUserPassword,
  formatCognitoUser,
  deleteUserFromCognito,
} from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type {
  IAuthUser,
  CreateUserInput,
  CreateUserCognitoDeps,
} from '../../types/authProviderTypes';

/**
 * Creates a user in Cognito using AdminCreateUser (admin invitation flow)
 * - Suppresses Cognito emails (custom invitation emails sent separately)
 * - Pre-verifies email address
 * - Sets the user's chosen password as permanent
 * - Cleans up the Cognito user if password setting fails
 */
export const createUserCognito = async (
  args: CreateUserInput,
  { client, userPoolId }: CreateUserCognitoDeps
): Promise<IAuthUser> => {
  if (!userPoolId) {
    throw new AuthRequestError('Missing required userPoolId');
  }

  let cognitoUsername: string | undefined;

  try {
    const cognitoUser = await adminCreateUserInCognito({
      client,
      userPoolId,
      username: args.email,
      messageAction: 'SUPPRESS',
      userAttributes: [
        { Name: 'email', Value: args.email },
        { Name: 'given_name', Value: args.firstName },
        { Name: 'family_name', Value: args.lastName },
        { Name: 'email_verified', Value: 'true' },
      ],
    });

    const { User } = cognitoUser;

    if (!User) {
      throw new AuthRequestError('Cognito response missing user data');
    }

    const formatted = formatCognitoUser(User);
    cognitoUsername = formatted.email ?? args.email;

    if (!formatted.id || !formatted.email || !formatted.firstName || !formatted.lastName) {
      throw new AuthRequestError('Cognito user is missing required attributes');
    }

    if (args.password) {
      await adminSetUserPassword({
        client,
        userPoolId,
        username: args.email,
        password: args.password,
        permanent: true,
      });
    }

    return {
      id: formatted.id,
      email: formatted.email,
      firstName: formatted.firstName,
      lastName: formatted.lastName,
    };
  } catch (error) {
    // Clean up Cognito user if it was created but a subsequent step failed
    if (cognitoUsername) {
      try {
        await deleteUserFromCognito({ client, userPoolId, username: cognitoUsername });
        logger.info('Cleaned up Cognito user after failed creation', { username: cognitoUsername });
      } catch (cleanupError: unknown) {
        logger.error('Failed to clean up Cognito user', { username: cognitoUsername, cleanupError });
      }
    }

    logger.error('Failed to create user in Cognito', { error });
    throw new AuthRequestError('Unable to create user in Cognito');
  }
};
