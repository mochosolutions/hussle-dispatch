import { logger } from '@/shared/utils/logger';
import type {
  User,
  UpdateUserServiceDeps,
  UpdateManyUsersDeps,
  UpdateUserInput,
} from '../../types/user';

export const updateUserService = async (
  id: string,
  data: UpdateUserInput,
  { updateUser }: any,
  context?: any
): Promise<User | null> => {
  try {
    return await updateUser(id, data, context);
  } catch (error) {
    logger.error('Error updating user', { userId: id, error });
    throw Error(`Failed to update user with ID ${id}`);
  }
};

export const updateManyUsersService = async (
  { filter, data }: UpdateUserServiceDeps,
  { updateManyUsers }: UpdateManyUsersDeps,
  context?: any
): Promise<User[] | null> => {
  try {
    logger.info('Updating users', { filter });
    const updatedUsers = await updateManyUsers(filter, data, context);
    logger.info('Updated users', { count: updatedUsers?.length ?? 0 });
    if (!updatedUsers) {
      return null;
    }
    return updatedUsers;
  } catch (error) {
    logger.error('Error updating users', { error });
    throw Error('Failed to update user(s)');
  }
};
