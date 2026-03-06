import { ConflictError } from '@/shared/errors';
import { createMembershipService } from '../createMembershipService';

describe('createMembershipService', () => {
  it('creates membership when no duplicate exists', async () => {
    const create = jest.fn().mockResolvedValue({ membershipId: 'mem-1' });
    const findOneByFilter = jest.fn().mockResolvedValue(null);

    const result = await createMembershipService(
      {
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        status: 'active',
      },
      { create, findOneByFilter },
    );

    expect(findOneByFilter).toHaveBeenCalledWith(
      { userId: 'user-1', organizationId: 'org-1' },
    );
    expect(create).toHaveBeenCalled();
    expect(result.membershipId).toBe('mem-1');
  });

  it('throws ConflictError when membership already exists', async () => {
    const create = jest.fn();
    const findOneByFilter = jest.fn().mockResolvedValue({ membershipId: 'existing' });

    await expect(
      createMembershipService(
        {
          userId: 'user-1',
          organizationId: 'org-1',
          role: 'admin',
          status: 'active',
        },
        { create, findOneByFilter },
      ),
    ).rejects.toThrow(ConflictError);
  });
});
