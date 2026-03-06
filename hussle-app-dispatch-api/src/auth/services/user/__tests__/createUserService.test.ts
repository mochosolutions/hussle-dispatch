import { ConflictError } from '@/shared/errors';
import { createUserService } from '../createUserService';

describe('createUserService', () => {
  it('creates user when email is unique', async () => {
    const findByEmail = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' });

    const result = await createUserService(
      {
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        externalId: 'external-1',
      },
      { create, findByEmail },
    );

    expect(findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(create).toHaveBeenCalled();
    expect(result?.id).toBe('user-1');
  });

  it('throws ConflictError when email already exists', async () => {
    const findByEmail = jest.fn().mockResolvedValue({ id: 'user-1' });
    const create = jest.fn();

    await expect(
      createUserService(
        {
          email: 'user@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          externalId: 'external-1',
        },
        { create, findByEmail },
      ),
    ).rejects.toThrow(ConflictError);
  });
});
