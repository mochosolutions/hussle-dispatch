import { logger } from '@/shared/utils/logger';
import type { User, GetUserServiceDeps } from '../../types/user';

export const getUserService = async (dep: GetUserServiceDeps, context?: any): Promise<User[]> => {
  const { findAllUsers } = dep;
  try {
    const users = await findAllUsers();
    if (!users || users.length === 0) {
      return [];
    }
    return users;
  } catch (error) {
    logger.error('Error fetching users', { error });
    throw new Error('Error fetching users');
  }
};
