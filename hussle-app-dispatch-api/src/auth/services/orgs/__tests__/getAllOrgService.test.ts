import { getAllOrgService } from '../getAllOrgService';

describe('getAllOrgService', () => {
  it('returns all organizations', async () => {
    const findAll = jest.fn().mockResolvedValue([{ id: 'org-1' }]);

    const result = await getAllOrgService({ findAll });

    expect(findAll).toHaveBeenCalledWith();
    expect(result).toHaveLength(1);
  });

  it('throws when repository call fails', async () => {
    const findAll = jest.fn().mockRejectedValue(new Error('db failed'));

    await expect(getAllOrgService({ findAll })).rejects.toThrow('Failed to fetch organizations');
  });
});
