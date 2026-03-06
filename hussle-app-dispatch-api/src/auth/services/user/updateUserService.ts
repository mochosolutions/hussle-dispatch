import { logger } from '@/shared/utils/logger';
import { SequenceError } from '@/shared/errors';
import type {
  User,
  UpdateUserServiceDeps,
  UpdateManyUsersDeps,
  UpdateUserInput,
} from '../../types/user';

interface UpdateUserDeps {
  updateUser: (id: string, data: Partial<User>) => Promise<User | null>;
}

interface UpdateUserInput2 {
  id: string;
  data: UpdateUserInput;
}

export const updateUserService = async (
  { id, data }: UpdateUserInput2,
  { updateUser }: UpdateUserDeps,
): Promise<User | null> => {
  try {
    return await updateUser(id, data);
  } catch (error) {
    logger.error('Error updating user', { userId: id, error });
    const serviceError = new SequenceError(`Failed to update user with ID ${id}`);
    serviceError.cause = error;
    throw serviceError;
  }
};

export const updateManyUsersService = async (
  { filter, data }: UpdateUserServiceDeps,
  { updateManyUsers }: UpdateManyUsersDeps,
): Promise<User[] | null> => {
  try {
    logger.info('Updating users', { filter });
    const updatedUsers = await updateManyUsers(filter, data);
    logger.info('Updated users', { count: updatedUsers?.length ?? 0 });
    if (!updatedUsers) {
      return null;
    }
    return updatedUsers;
  } catch (error) {
    logger.error('Error updating users', { error });
    const serviceError = new SequenceError('Failed to update user(s)');
    serviceError.cause = error;
    throw serviceError;
  }
};
