import { updateManyUsersService, updateUserService } from '../updateUserService';

describe('updateUserService', () => {
  it('updates a single user', async () => {
    const updateUser = jest.fn().mockResolvedValue({ id: 'user-1', firstName: 'Updated' });

    const result = await updateUserService({ id: 'user-1', data: { firstName: 'Updated' } }, { updateUser });

    expect(updateUser).toHaveBeenCalledWith('user-1', { firstName: 'Updated' });
    expect(result?.firstName).toBe('Updated');
  });
});

describe('updateManyUsersService', () => {
  it('updates many users and returns updated list', async () => {
    const updateManyUsers = jest.fn().mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]);

    const result = await updateManyUsersService(
      {
        filter: { organizationId: 'org-1' },
        data: { firstName: 'Updated' },
      },
      { updateManyUsers },
    );

    expect(updateManyUsers).toHaveBeenCalledWith(
      { organizationId: 'org-1' },
      { firstName: 'Updated' },
    );
    expect(result).toHaveLength(2);
  });

  it('returns null when repository returns null', async () => {
    const updateManyUsers = jest.fn().mockResolvedValue(null);

    const result = await updateManyUsersService(
      {
        filter: { organizationId: 'org-1' },
        data: { firstName: 'Updated' },
      },
      { updateManyUsers },
    );

    expect(result).toBeNull();
  });
});
