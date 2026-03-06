import { updateManyMembershipsService } from '../updateManyMembershipsService';

describe('updateManyMembershipsService', () => {
  it('returns updated memberships when repository responds', async () => {
    const updateManyMembership = jest.fn().mockResolvedValue([{ membershipId: 'mem-1' }]);

    const result = await updateManyMembershipsService(
      { filter: { organizationId: 'org-1' }, data: { status: 'inactive' } },
      { updateManyMembership },
    );

    expect(updateManyMembership).toHaveBeenCalledWith(
      { organizationId: 'org-1' },
      { status: 'inactive' },
    );
    expect(result).toHaveLength(1);
  });

  it('returns null when repository returns null', async () => {
    const updateManyMembership = jest.fn().mockResolvedValue(null);

    const result = await updateManyMembershipsService(
      { filter: { organizationId: 'org-1' }, data: { status: 'inactive' } },
      { updateManyMembership },
    );

    expect(result).toBeNull();
  });
});
