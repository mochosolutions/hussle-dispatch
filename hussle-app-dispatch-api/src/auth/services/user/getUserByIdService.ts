import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type { User, GetUserByIdInput, GetUserByIdDeps } from '../../types/user';

export const getUserByIdService = async (
  { userId }: GetUserByIdInput,
  { findUserById }: GetUserByIdDeps,
  context?: any
): Promise<User | null> => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return null;
    }
    return user;
  } catch (e) {
    logger.error('Error getting user by ID', { error: e });
    throw new AuthRequestError('Failed to get user data');
  }
};

export default getUserByIdService;
