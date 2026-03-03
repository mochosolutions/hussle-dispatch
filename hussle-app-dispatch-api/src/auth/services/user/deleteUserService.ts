import type { User } from '../../types/user';

export interface DeleteUserServiceDeps {
  deleteById: any;
}

export interface DeleteManyUserServiceDeps {
  deleteMany: any;
}

export const deleteUserService = async (
  id: string,
  { deleteById }: DeleteUserServiceDeps,
  context?: any
): Promise<User | null> => {
  try {
    return await deleteById(id, context);
  } catch (error) {
    // Optionally log or handle error as needed
    throw Error(`Failed to delete User with ID ${id}`);
  }
};

export const deleteManyUserService = async (
  ids: string[],
  { deleteMany }: DeleteManyUserServiceDeps,
  context?: any
): Promise<User | null> => {
  try {
    const filter = { _id: { $in: ids } };
    return await deleteMany(filter, context);
  } catch (error) {
    throw Error(`Failed to delete user with ID`);
  }
};
