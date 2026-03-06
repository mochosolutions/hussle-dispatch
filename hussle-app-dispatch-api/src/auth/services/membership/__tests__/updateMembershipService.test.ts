import { updateMembershipService } from '../updateMembershipService';

describe('updateMembershipService', () => {
  it('updates membership by id', async () => {
    const updateMembership = jest.fn().mockResolvedValue({ membershipId: 'mem-1', role: 'admin' });

    const result = await updateMembershipService({ id: 'mem-1', data: { role: 'admin' } }, { updateMembership });

    expect(updateMembership).toHaveBeenCalledWith('mem-1', { role: 'admin' });
    expect(result?.membershipId).toBe('mem-1');
  });

  it('throws descriptive error when update fails', async () => {
    const updateMembership = jest.fn().mockRejectedValue(new Error('db failed'));

    await expect(
      updateMembershipService({ id: 'mem-1', data: { role: 'admin' } }, { updateMembership }),
    ).rejects.toThrow('Failed to update membership with ID mem-1');
  });
});
