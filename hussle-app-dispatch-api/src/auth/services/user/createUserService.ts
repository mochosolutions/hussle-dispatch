import { logger } from '@/shared/utils/logger';
import { ConflictError, SequenceError, isCustomError } from '@/shared/errors';
import type { User, CreateUserInput, CreateUserServiceDeps } from '../../types/user';

export const createUserService = async (
  data: CreateUserInput,
  { create, findByEmail }: CreateUserServiceDeps,
): Promise<User> => {
  try {
    const exists = await findByEmail(data.email);
    if (exists) {
      throw new ConflictError(`User with email "${data.email}" already exists`);
    }
    const user = await create(data);
    return user;
  } catch (error) {
    if (isCustomError(error)) {
      throw error;
    }
    logger.error('Error creating user', { error });
    const serviceError = new SequenceError('Failed to create user');
    serviceError.cause = error;
    throw serviceError;
  }
};
