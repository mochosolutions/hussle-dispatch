import { logger } from '@/shared/utils/logger';
import { createUserInCognito } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type {
  CreateUserInput,
  SignUpUserCognitoDeps,
  SignUpUserResponse,
} from '../../types/authProviderTypes';

/**
 * Creates a user via public self-service signup (SignUp API)
 * - User status: UNCONFIRMED (requires email verification)
 * - Cognito automatically sends verification code to email
 * - User must call confirmSignUp with code before login
 * - Use this for public registration, NOT admin invitations
 */
export const signUpUserCognito = async (
  args: CreateUserInput,
  { client, clientId }: SignUpUserCognitoDeps
): Promise<SignUpUserResponse> => {
  if (!clientId) {
    throw new AuthRequestError('Missing required clientId');
  }

  try {
    // Note: createUserInCognito expects 'temporaryPassword' parameter name
    // but for SignUp, this is actually the user's permanent password choice
    const response = await createUserInCognito({
      client,
      clientId,
      username: args.email,
      temporaryPassword: args.password, // Parameter name is 'temporaryPassword' but value is user's chosen password
      userAttributes: [
        { Name: 'email', Value: args.email },
        { Name: 'given_name', Value: args.firstName },
        { Name: 'family_name', Value: args.lastName },
      ],
    });

    // SignUp API returns UserSub (Cognito user ID) and code delivery details
    return {
      id: response.UserSub || '', // Cognito sub (external user ID)
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      codeDeliveryDetails: response.CodeDeliveryDetails
        ? {
            destination: response.CodeDeliveryDetails.Destination,
            deliveryMedium: response.CodeDeliveryDetails.DeliveryMedium,
            attributeName: response.CodeDeliveryDetails.AttributeName,
          }
        : undefined,
    };
  } catch (error: unknown) {
    logger.error('Failed to sign up user in Cognito', { error });

    // Handle common Cognito errors
    if (typeof error === 'object' && error !== null && 'name' in error) {
      const name = (error as { name: string }).name;
      if (name === 'UsernameExistsException') {
        throw new AuthRequestError('An account with this email already exists');
      }
      if (name === 'InvalidPasswordException') {
        throw new AuthRequestError(
          'Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, numbers, and special characters.'
        );
      }
      if (name === 'InvalidParameterException') {
        throw new AuthRequestError('Invalid signup parameters. Please check your input.');
      }
    }

    throw new AuthRequestError('Unable to create user account. Please try again.');
  }
};
