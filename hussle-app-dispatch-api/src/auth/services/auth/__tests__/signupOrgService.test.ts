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

  const baseConfig = { defaultOrgRole: 'CARRIER' };

  const createRepoDeps = (overrides?: {
    organizationRepository?: Record<string, jest.Mock>;
    userRepository?: Record<string, jest.Mock>;
    membershipRepository?: Record<string, jest.Mock>;
  }) => ({
    organizationRepository: {
      create: jest.fn().mockResolvedValue({
        id: 'org-1',
        name: 'Acme Logistics',
        slug: 'acme-logistics',
        status: 'ACTIVE',
        subscriptionTier: 'TRIAL',
      }),
      findSlugsWithPrefix: jest.fn().mockResolvedValue([]),
      ...overrides?.organizationRepository,
    },
    userRepository: {
      create: jest.fn().mockResolvedValue({
        id: 'user-1',
        firstName: 'Owner',
        lastName: 'User',
        email: 'owner@example.com',
      }),
      ...overrides?.userRepository,
    },
    membershipRepository: {
      create: jest.fn().mockResolvedValue({
        membershipId: 'mem-1',
        role: 'admin',
      }),
      ...overrides?.membershipRepository,
    },
  });

  it('creates organization, user, and membership in one transaction', async () => {
    const repos = createRepoDeps();
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      ...repos,
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
    expect(deps.userRepository.create).toHaveBeenCalled();
    expect(deps.membershipRepository.create).toHaveBeenCalled();
    expect(result.user.userId).toBe('user-1');
    expect(result.tenant.tenantId).toBe('org-1');
  });

  it('cleans up external user when transaction fails after sign-up', async () => {
    const repos = createRepoDeps({
      organizationRepository: {
        create: jest.fn().mockRejectedValue(new Error('db write failed')),
        findSlugsWithPrefix: jest.fn().mockResolvedValue([]),
      },
    });
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      ...repos,
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
    const repos = createRepoDeps();
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      ...repos,
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
    expect(deps.organizationRepository.create).not.toHaveBeenCalled();
    expect(deps.userRepository.create).not.toHaveBeenCalled();
    expect(deps.membershipRepository.create).not.toHaveBeenCalled();
    expect(deps.authProvider.deleteUser).not.toHaveBeenCalled();
  });

  it('throws validation error when signup email already exists', async () => {
    const repos = createRepoDeps();
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      ...repos,
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
    expect(deps.userRepository.create).not.toHaveBeenCalled();
    expect(deps.membershipRepository.create).not.toHaveBeenCalled();
    expect(deps.authProvider.deleteUser).not.toHaveBeenCalled();
  });

  it('sets organization status to ACTIVE by default', async () => {
    const repos = createRepoDeps();
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      ...repos,
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

    await signupOrganizationUseCase(baseInput, deps);

    const orgCreateArg = deps.organizationRepository.create.mock.calls[0][0];
    expect(orgCreateArg.status).toBe('ACTIVE');
  });

  it('passes transaction client to all three repository calls', async () => {
    const txStub = { id: 'tx-mock' };
    const repos = createRepoDeps();
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn(txStub)),
      },
      ...repos,
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

    await signupOrganizationUseCase(baseInput, deps);

    expect(deps.organizationRepository.create.mock.calls[0][1]).toBe(txStub);
    expect(deps.userRepository.create.mock.calls[0][1]).toBe(txStub);
    expect(deps.membershipRepository.create.mock.calls[0][1]).toBe(txStub);
  });

  it('passes correct userId and organizationId to membership create', async () => {
    const repos = createRepoDeps();
    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      ...repos,
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

    await signupOrganizationUseCase(baseInput, deps);

    const membershipArg = deps.membershipRepository.create.mock.calls[0][0];
    expect(membershipArg.userId).toBe('user-1');
    expect(membershipArg.organizationId).toBe('org-1');
  });

  it('retries on slug collision with P2002 unique constraint error', async () => {
    const p2002Error = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    const repos = createRepoDeps();
    // First call throws P2002, second call succeeds
    repos.organizationRepository.create
      .mockRejectedValueOnce(p2002Error)
      .mockResolvedValueOnce({
        id: 'org-1',
        name: 'Acme Logistics',
        slug: 'acme-logistics-1',
        status: 'ACTIVE',
        subscriptionTier: 'TRIAL',
      });

    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      ...repos,
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

    expect(deps.organizationRepository.create).toHaveBeenCalledTimes(2);
    expect(result.tenant.tenantId).toBe('org-1');
  });

  it('throws ConflictError after max slug collision retries exhausted', async () => {
    const p2002Error = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    const repos = createRepoDeps({
      organizationRepository: {
        create: jest.fn().mockRejectedValue(p2002Error),
        findSlugsWithPrefix: jest.fn().mockResolvedValue([]),
      },
    });

    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      ...repos,
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

    await expect(signupOrganizationUseCase(baseInput, deps)).rejects.toThrow('naming conflict');
    expect(deps.organizationRepository.create).toHaveBeenCalledTimes(3);
    expect(deps.authProvider.deleteUser).toHaveBeenCalledWith('external-1');
  });

});
