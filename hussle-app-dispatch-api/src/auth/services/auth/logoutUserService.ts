import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type { ITokenProvider } from '../../types/tokenProvider';

interface LogoutUserDeps {
  tokenProvider: ITokenProvider;
}

interface LogoutInput {
  sessionId: string;
  refreshToken: string;
}

export const logoutUserService = async (args: LogoutInput, { tokenProvider }: LogoutUserDeps) => {
  try {
    const { sessionId, refreshToken } = args;

    const response = await tokenProvider.revokeSession({ sessionId, refreshToken });

    return response;
  } catch (e) {
    logger.error('Error logging out user', { error: e });
    throw new AuthRequestError('Failed to logout user');
  }
};
