import { getMembershipService, getUsersMembershipService } from '../getUsersMembershipService';

describe('getUsersMembershipService', () => {
  it('returns membership for user id', async () => {
    const findByUserId = jest.fn().mockResolvedValue({ membershipId: 'mem-1' });

    const result = await getUsersMembershipService('user-1', { findByUserId });

    expect(findByUserId).toHaveBeenCalledWith('user-1');
    expect(result?.membershipId).toBe('mem-1');
  });

  it('throws descriptive error when repository call fails', async () => {
    const findByUserId = jest.fn().mockRejectedValue(new Error('db failed'));

    await expect(getUsersMembershipService('user-1', { findByUserId })).rejects.toThrow(
      'Failed to fetch membership with ID user-1',
    );
  });
});

describe('getMembershipService', () => {
  it('returns all memberships', async () => {
    const findAllMemberships = jest.fn().mockResolvedValue([{ membershipId: 'mem-1' }]);

    const result = await getMembershipService({ findAllMemberships });

    expect(findAllMemberships).toHaveBeenCalledWith();
    expect(result).toHaveLength(1);
  });
});
