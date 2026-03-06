import { deleteManyUserService, deleteUserService } from '../deleteUserService';

describe('deleteUserService', () => {
  it('deletes user by id', async () => {
    const deleteById = jest.fn().mockResolvedValue({ id: 'user-1' });

    const result = await deleteUserService('user-1', { deleteById });

    expect(deleteById).toHaveBeenCalledWith('user-1');
    expect(result?.id).toBe('user-1');
  });
});

describe('deleteManyUserService', () => {
  it('deletes many users by ids', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });

    const result = await deleteManyUserService(['user-1', 'user-2'], { deleteMany });

    expect(deleteMany).toHaveBeenCalledWith({ _id: { $in: ['user-1', 'user-2'] } });
    expect(result).toEqual({ deletedCount: 2 });
  });
});
