import { logger } from '@/shared/utils/logger';
import { SequenceError } from '@/shared/errors';
import type { User, GetUserServiceDeps } from '../../types/user';

export const getUserService = async (dep: GetUserServiceDeps): Promise<User[]> => {
  const { findAllUsers } = dep;
  try {
    const users = await findAllUsers();
    if (!users || users.length === 0) {
      return [];
    }
    return users;
  } catch (error) {
    logger.error('Error fetching users', { error });
    const serviceError = new SequenceError('Error fetching users');
    serviceError.cause = error;
    throw serviceError;
  }
};
