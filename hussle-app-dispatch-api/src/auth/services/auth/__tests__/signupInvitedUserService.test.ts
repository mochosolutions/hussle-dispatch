import { signupInvitedUserUseCase } from '../signupInvitedUserService';

describe('signupInvitedUserUseCase', () => {
  const baseInput = {
    invitationToken: 'invite-token',
    password: 'password-1',
  };

  const baseInvite = {
    id: 'invite-1',
    email: 'invited@example.com',
    firstName: 'Invited',
    lastName: 'User',
    role: 'admin',
    organizationId: 'org-1',
  };

  it('accepts invite and creates invited user membership', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      acceptInvitationService: jest.fn().mockResolvedValue({ invite: baseInvite }),
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

    expect(deps.acceptInvitationService).toHaveBeenCalledWith(
      { invitationToken: 'invite-token' },
      expect.anything(),
    );
    expect(deps.authProvider.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'invited@example.com',
        password: 'password-1',
        firstName: 'Invited',
        lastName: 'User',
        orgRole: 'admin',
        orgId: 'org-1',
      }),
    );
    expect(deps.createUserService).toHaveBeenCalled();
    expect(result.user.userId).toBe('user-1');
    expect(result.tenant.tenantId).toBe('org-1');
  });

  it('cleans up external user when organization lookup fails', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      acceptInvitationService: jest.fn().mockResolvedValue({ invite: baseInvite }),
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
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      acceptInvitationService: jest.fn().mockResolvedValue({ invite: baseInvite }),
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

    await expect(signupInvitedUserUseCase(baseInput, deps)).rejects.toThrow(
      'Membership creation failed',
    );
    expect(deps.authProvider.deleteUser).toHaveBeenCalledWith('ext-1');
  });

  it('rolls back invitation status when user creation fails', async () => {
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
      acceptInvitationService: jest.fn().mockResolvedValue({ invite: baseInvite }),
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

    await expect(signupInvitedUserUseCase(baseInput, deps)).rejects.toThrow(
      'User creation failed',
    );

    expect(transactionRolledBack).toBe(true);
    expect(deps.authProvider.deleteUser).toHaveBeenCalledWith('ext-1');
    expect(deps.createMembershipService).not.toHaveBeenCalled();
  });

  it('throws when invitation is missing first/last name', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      acceptInvitationService: jest.fn().mockResolvedValue({
        invite: { ...baseInvite, firstName: null, lastName: null },
      }),
      createUserService: jest.fn(),
      createMembershipService: jest.fn(),
      findOrganizationById: jest.fn(),
      authProvider: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    };

    await expect(signupInvitedUserUseCase(baseInput, deps)).rejects.toThrow(
      'Invitation is missing user details',
    );
    expect(deps.authProvider.createUser).not.toHaveBeenCalled();
  });
});
