import { logger } from '@/shared/utils/logger';
import { adminCreateUserInCognito, formatCognitoUser } from '@/shared/utils/cognito';
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
 * - User must change temp password on first login OR use adminSetUserPassword
 */
export const createUserCognito = async (
  args: CreateUserInput,
  { client, userPoolId }: CreateUserCognitoDeps
): Promise<IAuthUser> => {
  if (!userPoolId) {
    throw new AuthRequestError('Missing required userPoolId');
  }

  try {
    const cognitoUser = await adminCreateUserInCognito({
      client,
      userPoolId,
      username: args.email,
      messageAction: 'SUPPRESS', // Don't send Cognito email
      userAttributes: [
        { Name: 'email', Value: args.email },
        { Name: 'given_name', Value: args.firstName },
        { Name: 'family_name', Value: args.lastName },
        { Name: 'email_verified', Value: 'true' }, // Pre-verify email
      ],
    });

    const { User } = cognitoUser;

    if (!User) {
      throw new AuthRequestError('Cognito response missing user data');
    }

    const { email, firstName, lastName, id } = formatCognitoUser(User);

    return { id, email, firstName, lastName };
  } catch (error) {
    logger.error('Failed to create user in Cognito', { error });
    throw new AuthRequestError('Unable to create user in Cognito');
  }
};
