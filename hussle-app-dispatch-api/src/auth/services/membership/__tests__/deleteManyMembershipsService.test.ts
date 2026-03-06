import { deleteManyMembershipsService } from '../deleteManyMembershipsService';

describe('deleteManyMembershipsService', () => {
  it('deletes memberships by id list', async () => {
    const deleteManyMemberships = jest.fn().mockResolvedValue([{ membershipId: 'mem-1' }]);

    const result = await deleteManyMembershipsService(
      { ids: ['mem-1'] },
      { deleteManyMemberships },
    );

    expect(deleteManyMemberships).toHaveBeenCalledWith(['mem-1']);
    expect(result).toHaveLength(1);
  });

  it('returns null when repository returns null', async () => {
    const deleteManyMemberships = jest.fn().mockResolvedValue(null);

    const result = await deleteManyMembershipsService(
      { ids: ['mem-1'] },
      { deleteManyMemberships },
    );

    expect(result).toBeNull();
  });
});
