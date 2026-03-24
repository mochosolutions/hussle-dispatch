import { currentUserService } from '../currentUserService';

describe('currentUserService', () => {
  it('returns null when user is not found', async () => {
    const findUserByIdWithMemberships = jest.fn().mockResolvedValue(null);

    const result = await currentUserService(
      {
        user: {
          userId: 'user-1',
          email: 'user@example.com',
          role: 'admin',
          organizationId: 'org-1',
          orgSlug: 'org-one',
        },
      },
      { findUserByIdWithMemberships },
    );

    expect(result).toBeNull();
  });

  it('returns user and accessible orgs when found', async () => {
    const findUserByIdWithMemberships = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      memberships: [{ organizationId: 'org-1' }, { organizationId: 'org-2' }],
    });

    const result = await currentUserService(
      {
        user: {
          userId: 'user-1',
          email: 'user@example.com',
          role: 'admin',
          organizationId: 'org-2',
          orgSlug: 'org-two',
        },
      },
      { findUserByIdWithMemberships },
    );

    expect(result?.accessibleOrgs).toHaveLength(2);
    expect(result?.user.organizationId).toBe('org-2');
    expect(result?.user.role).toBe('admin');
  });
});
