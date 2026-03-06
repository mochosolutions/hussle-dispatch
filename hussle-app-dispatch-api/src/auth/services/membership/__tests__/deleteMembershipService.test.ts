import { deleteMembershipService } from '../deleteMembershipService';

describe('deleteMembershipService', () => {
  it('deletes membership by id', async () => {
    const deleteById = jest.fn().mockResolvedValue({ membershipId: 'mem-1' });

    const result = await deleteMembershipService('mem-1', { deleteById });

    expect(deleteById).toHaveBeenCalledWith('mem-1');
    expect(result?.membershipId).toBe('mem-1');
  });

  it('throws descriptive error when delete fails', async () => {
    const deleteById = jest.fn().mockRejectedValue(new Error('db failed'));

    await expect(deleteMembershipService('mem-1', { deleteById })).rejects.toThrow(
      'Failed to delete membership with ID mem-1',
    );
  });
});
