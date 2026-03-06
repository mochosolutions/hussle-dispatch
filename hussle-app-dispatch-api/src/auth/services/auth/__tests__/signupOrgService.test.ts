import { signupOrganizationUseCase } from '../signupOrgService';

describe('signupOrganizationUseCase', () => {
  const baseInput = {
    email: 'owner@example.com',
    password: 'password-1',
    firstName: 'Owner',
    lastName: 'User',
    orgName: 'Acme Logistics',
    customMetadata: {},
  };

  const baseConfig = { defaultOrgRole: 'carrier' };

  it('creates organization, user, and membership in one transaction', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      organizationRepository: {
        create: jest.fn().mockResolvedValue({
          organization: {
            id: 'org-1',
            name: 'Acme Logistics',
            slug: 'acme-logistics',
            status: 'active',
            subscriptionTier: 'free',
          },
          user: {
            id: 'user-1',
            firstName: 'Owner',
            lastName: 'User',
            email: 'owner@example.com',
          },
          membership: {
            membershipId: 'mem-1',
            role: 'admin',
          },
        }),
      },
      authProvider: {
        signUpUser: jest.fn().mockResolvedValue({
          id: 'external-1',
          email: 'owner@example.com',
          firstName: 'Owner',
          lastName: 'User',
        }),
        deleteUser: jest.fn(),
      },
      config: baseConfig,
    };

    const result = await signupOrganizationUseCase(baseInput, deps);

    expect(deps.transactionManager.runInTransaction).toHaveBeenCalled();
    expect(deps.authProvider.signUpUser).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'password-1',
      firstName: 'Owner',
      lastName: 'User',
    });
    expect(deps.organizationRepository.create).toHaveBeenCalled();
    expect(result.user.userId).toBe('user-1');
    expect(result.tenant.tenantId).toBe('org-1');
  });

  it('cleans up external user when transaction fails after sign-up', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      organizationRepository: {
        create: jest.fn().mockRejectedValue(new Error('db write failed')),
      },
      authProvider: {
        signUpUser: jest.fn().mockResolvedValue({
          id: 'external-1',
          email: 'owner@example.com',
          firstName: 'Owner',
          lastName: 'User',
        }),
        deleteUser: jest.fn().mockResolvedValue({ id: 'external-1' }),
      },
      config: baseConfig,
    };

    await expect(signupOrganizationUseCase(baseInput, deps)).rejects.toThrow('db write failed');
    expect(deps.authProvider.deleteUser).toHaveBeenCalledWith('external-1');
  });

  it('does not start transaction when external signup fails', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      organizationRepository: {
        create: jest.fn(),
      },
      authProvider: {
        signUpUser: jest.fn().mockRejectedValue(new Error('external signup failed')),
        deleteUser: jest.fn(),
      },
      config: baseConfig,
    };

    await expect(signupOrganizationUseCase(baseInput, deps)).rejects.toThrow(
      'external signup failed',
    );
    expect(deps.transactionManager.runInTransaction).not.toHaveBeenCalled();
    expect(deps.authProvider.deleteUser).not.toHaveBeenCalled();
  });

  it('throws validation error when signup email already exists', async () => {
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      organizationRepository: {
        create: jest.fn(),
      },
      authProvider: {
        signUpUser: jest
          .fn()
          .mockRejectedValue(new Error('An account with this email already exists')),
        deleteUser: jest.fn(),
      },
      config: baseConfig,
    };

    await expect(signupOrganizationUseCase(baseInput, deps)).rejects.toThrow(
      'An account with this email already exists. Please log in.',
    );
    expect(deps.transactionManager.runInTransaction).not.toHaveBeenCalled();
    expect(deps.organizationRepository.create).not.toHaveBeenCalled();
    expect(deps.authProvider.deleteUser).not.toHaveBeenCalled();
  });
});
