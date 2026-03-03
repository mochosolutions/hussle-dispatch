import { logger } from '@/shared/utils/logger';
import type { User, CreateUserInput, CreateUserServiceDeps } from '../../types/user';

export const createUserService = async (
  data: CreateUserInput,
  { create, findByEmail }: CreateUserServiceDeps,
  context?: any
): Promise<User> => {
  try {
    const exists = await findByEmail(data.email, context);
    if (exists) {
      throw new Error(`User with email "${data.email}" already exists`);
    }
    const user = await create(data, context);
    return user;
  } catch (error) {
    logger.error('Error creating user', { error });
    throw new Error('Failed to create user');
  }
};
