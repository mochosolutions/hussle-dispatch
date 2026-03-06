import type { User } from '../../types/user';

export interface DeleteUserServiceDeps {
  deleteById: (id: string) => Promise<User | null>;
}

export interface DeleteManyUserServiceDeps {
  deleteMany: (filter: Record<string, unknown>) => Promise<User | null>;
}

export const deleteUserService = async (
  id: string,
  { deleteById }: DeleteUserServiceDeps,
): Promise<User | null> => {
  try {
    return await deleteById(id);
  } catch {
    // Optionally log or handle error as needed
    throw Error(`Failed to delete User with ID ${id}`);
  }
};

export const deleteManyUserService = async (
  ids: string[],
  { deleteMany }: DeleteManyUserServiceDeps,
): Promise<User | null> => {
  try {
    const filter = { _id: { $in: ids } };
    return await deleteMany(filter);
  } catch {
    throw Error(`Failed to delete user with ID`);
  }
};
