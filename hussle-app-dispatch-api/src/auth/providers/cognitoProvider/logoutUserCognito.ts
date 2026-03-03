import { logger } from '@/shared/utils/logger';
import { logoutCognitoUser } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type { LogoutInput, LogoutUserCognitoDeps } from '../../types/authProviderTypes';

export const logoutUserCognito = async (args: LogoutInput, { client }: LogoutUserCognitoDeps) => {
  try {
    const cognitoUser = await logoutCognitoUser({
      client,
      accessToken: args.accessToken,
    });
    return cognitoUser;
  } catch (error) {
    logger.error('Error logging out user', { error });
    throw new AuthRequestError('Failed to logout user');
  }
};
