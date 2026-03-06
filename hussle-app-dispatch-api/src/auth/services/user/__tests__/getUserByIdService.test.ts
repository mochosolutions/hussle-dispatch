import { AuthRequestError } from '@/shared/errors/authError';
import { getUserByIdService } from '../getUserByIdService';

describe('getUserByIdService', () => {
  it('returns user when found', async () => {
    const findUserById = jest.fn().mockResolvedValue({ id: 'user-1' });

    const result = await getUserByIdService({ userId: 'user-1' }, { findUserById });

    expect(findUserById).toHaveBeenCalledWith('user-1');
    expect(result?.id).toBe('user-1');
  });

  it('returns null when user does not exist', async () => {
    const findUserById = jest.fn().mockResolvedValue(null);

    const result = await getUserByIdService({ userId: 'user-1' }, { findUserById });

    expect(result).toBeNull();
  });

  it('throws AuthRequestError when lookup fails', async () => {
    const findUserById = jest.fn().mockRejectedValue(new Error('db failed'));

    await expect(getUserByIdService({ userId: 'user-1' }, { findUserById })).rejects.toBeInstanceOf(
      AuthRequestError,
    );
  });
});
