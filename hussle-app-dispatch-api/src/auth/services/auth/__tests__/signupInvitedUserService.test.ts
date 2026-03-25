import { signupInvitedUserUseCase } from '../signupInvitedUserService';

describe('signupInvitedUserUseCase', () => {
  const baseInput = {
    email: 'invited@example.com',
    password: 'password-1',
    firstName: 'Invited',
    lastName: 'User',
    role: 'admin',
    invitationToken: 'invite-token',
    organizationId: 'org-1',

  };

  it('accepts invite and creates invited user membership', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      acceptInvitationService: jest.fn().mockResolvedValue({ id: 'invite-1' }),
      createUserService: jest.fn().mockResolvedValue({
        id: 'user-1',
        firstName: 'Invited',
        lastName: 'User',
        email: 'invited@example.com',
      }),
      createMembershipService: jest.fn().mockResolvedValue({
        membershipId: 'mem-1',
        role: 'admin',
      }),
      findOrganizationById: jest.fn().mockResolvedValue({
        id: 'org-1',
        name: 'Org One',
        slug: 'org-one',
        status: 'active',
        subscriptionTier: 'starter',
      }),
      authProvider: {
        createUser: jest.fn().mockResolvedValue({
          id: 'external-1',
          email: 'invited@example.com',
          firstName: 'Invited',
          lastName: 'User',
        }),
        deleteUser: jest.fn(),
      },
    };

    const result = await signupInvitedUserUseCase(baseInput, deps);

    expect(deps.acceptInvitationService).toHaveBeenCalled();
    expect(deps.authProvider.createUser).toHaveBeenCalled();
    expect(deps.createUserService).toHaveBeenCalled();
    expect(result.user.userId).toBe('user-1');
    expect(result.tenant.tenantId).toBe('org-1');
  });

  it('cleans up external user when organization lookup fails', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      acceptInvitationService: jest.fn().mockResolvedValue({ id: 'invite-1' }),
      createUserService: jest.fn().mockResolvedValue({
        id: 'user-1',
        firstName: 'Invited',
        lastName: 'User',
        email: 'invited@example.com',
      }),
      createMembershipService: jest.fn().mockResolvedValue({
        membershipId: 'mem-1',
        role: 'admin',
      }),
      findOrganizationById: jest.fn().mockResolvedValue(null),
      authProvider: {
        createUser: jest.fn().mockResolvedValue({
          id: 'external-1',
          email: 'invited@example.com',
          firstName: 'Invited',
          lastName: 'User',
        }),
        deleteUser: jest.fn().mockResolvedValue({ id: 'external-1' }),
      },
    };

    await expect(signupInvitedUserUseCase(baseInput, deps)).rejects.toThrow(
      'Organization not found',
    );
    expect(deps.authProvider.deleteUser).toHaveBeenCalledWith('external-1');
  });

  it('cleans up external user when transaction fails after Cognito user creation', async () => {
    // Arrange
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      acceptInvitationService: jest.fn().mockResolvedValue({ id: 'invite-1' }),
      createUserService: jest.fn().mockResolvedValue({
        id: 'user-1',
        firstName: 'Invited',
        lastName: 'User',
        email: 'invited@example.com',
      }),
      createMembershipService: jest.fn().mockRejectedValue(
        new Error('Membership creation failed'),
      ),
      findOrganizationById: jest.fn().mockResolvedValue({
        id: 'org-1',
        name: 'Org One',
        slug: 'org-one',
        status: 'active',
        subscriptionTier: 'starter',
      }),
      authProvider: {
        createUser: jest.fn().mockResolvedValue({
          id: 'ext-1',
          email: 'invited@example.com',
          firstName: 'Invited',
          lastName: 'User',
        }),
        deleteUser: jest.fn().mockResolvedValue({ id: 'ext-1' }),
      },
    };

    // Act & Assert
    await expect(signupInvitedUserUseCase(baseInput, deps)).rejects.toThrow(
      'Membership creation failed',
    );
    expect(deps.authProvider.deleteUser).toHaveBeenCalledWith('ext-1');
  });

  it('rolls back invitation status when user creation fails', async () => {
    // Arrange
    let transactionRolledBack = false;
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => {
          try {
            return await fn({});
          } catch (error) {
            transactionRolledBack = true;
            throw error;
          }
        }),
      },
      acceptInvitationService: jest.fn().mockResolvedValue({ id: 'invite-1' }),
      createUserService: jest.fn().mockRejectedValue(
        new Error('User creation failed'),
      ),
      createMembershipService: jest.fn(),
      findOrganizationById: jest.fn(),
      authProvider: {
        createUser: jest.fn().mockResolvedValue({
          id: 'ext-1',
          email: 'invited@example.com',
          firstName: 'Invited',
          lastName: 'User',
        }),
        deleteUser: jest.fn().mockResolvedValue({ id: 'ext-1' }),
      },
    };

    // Act & Assert
    await expect(signupInvitedUserUseCase(baseInput, deps)).rejects.toThrow(
      'User creation failed',
    );

    // The transaction should have rolled back (invitation stays PENDING)
    expect(transactionRolledBack).toBe(true);

    // External user should be cleaned up since it was created before the failure
    expect(deps.authProvider.deleteUser).toHaveBeenCalledWith('ext-1');

    // Membership should never have been attempted
    expect(deps.createMembershipService).not.toHaveBeenCalled();
  });
});
