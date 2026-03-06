import { getUserService } from '../getUsersService';

describe('getUserService', () => {
  it('returns users when records exist', async () => {
    const findAllUsers = jest.fn().mockResolvedValue([{ id: 'user-1' }]);

    const result = await getUserService({ findAllUsers });

    expect(findAllUsers).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('returns empty list when repository returns no users', async () => {
    const findAllUsers = jest.fn().mockResolvedValue([]);

    const result = await getUserService({ findAllUsers });

    expect(result).toEqual([]);
  });
});
