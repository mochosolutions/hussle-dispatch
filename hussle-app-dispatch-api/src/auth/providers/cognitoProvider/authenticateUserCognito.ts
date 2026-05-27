import { authenticateCognitoUser } from '@/shared/utils/cognito';
import { AuthStatus } from '@/shared/constants/authConstants';
import { decodeToken } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type {
  AuthenticateUserInput,
  AuthenticateUserCognitoDeps,
} from '../../types/authProviderTypes';

export const authenticateUserCognito = async (
  { username, password }: AuthenticateUserInput,
  { client, clientId }: AuthenticateUserCognitoDeps
) => {
  try {
    const authResponse = await authenticateCognitoUser({
      username,
      password,
      client,
      clientId,
    });

    const user = { email: username };

    if ('challengeName' in authResponse && authResponse.challengeName === 'UNCONFIRMED') {
      return {
        status: AuthStatus.UNCONFIRMED,
        user,
        challengeName: authResponse.challengeName,
      };
    }

    if (!('accessToken' in authResponse)) {
      throw new AuthRequestError('Unexpected Cognito response format');
    }

    const { accessToken, refreshToken, idToken, expiresIn, session, challengeName } = authResponse;

    if (session && challengeName === 'NEW_PASSWORD_REQUIRED') {
      return {
        status: AuthStatus.CHALLENGE_REQUIRED,
        session,
        challengeName,
        user,
      };
    }

    const decodedUser = decodeToken(idToken);

    if (!decodedUser) {
      throw new AuthRequestError('Failed to decode ID token');
    }

    const email = decodedUser?.email ?? '';
    const firstName = decodedUser?.given_name ?? '';
    const lastName = decodedUser?.family_name ?? '';
    const id = decodedUser?.sub ?? '';
    const formattedUser = {
      email,
      firstName,
      lastName,
      id,
    };

    return {
      status: AuthStatus.AUTHENTICATED,
      session,
      token: {
        accessToken,
        refreshToken,
        idToken,
        expiresIn,
      },
      user: formattedUser,
    };
  } catch {
    throw new AuthRequestError('Failed to authenticateUser tenant');
  }
};
