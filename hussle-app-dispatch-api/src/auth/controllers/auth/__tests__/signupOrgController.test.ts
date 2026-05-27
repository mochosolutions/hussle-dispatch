import jwt from 'jsonwebtoken';
import { createSignupOrgController } from '../signupOrgController';

process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'test-jwt-secret';
import type { SignupOrgInput, SignupOrgResult } from '../../../types/signupOrgTypes';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { ITokenProvider } from '../../../types/tokenProvider';
import type { Request, Response } from 'express';

const buildSignupResult = (overrides?: Partial<SignupOrgResult>): SignupOrgResult => ({
  user: {
    firstName: 'Owner',
    lastName: 'User',
    email: 'owner@example.com',
    userId: 'user-1',
    role: 'admin',
    ...overrides?.user,
  },
  tenant: {
    tenantId: 'org-1',
    name: 'Acme Logistics',
    slug: 'acme-logistics',
    status: 'ACTIVE',
    subscriptionTier: 'TRIAL',
    membershipId: 'mem-1',
    ...overrides?.tenant,
  },
});

const buildSignupInput = (overrides?: Partial<SignupOrgInput>): SignupOrgInput => ({
  email: 'owner@example.com',
  password: 'password-1',
  firstName: 'Owner',
  lastName: 'User',
  orgName: 'Acme Logistics',
  ...overrides,
});

const createMockReq = (body: SignupOrgInput): Partial<Request> => ({
  body,
});

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

const createMockEventBus = (): {
  publish: jest.Mock;
  publishDelayed: jest.Mock;
  subscribe: jest.Mock;
  close: jest.Mock;
} => ({
  publish: jest.fn().mockResolvedValue(undefined),
  publishDelayed: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

const createMockLogger = (): { info: jest.Mock; debug: jest.Mock; warn: jest.Mock; error: jest.Mock } => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildSignedAccessToken = (): string =>
  jwt.sign({ userId: 'user-1', sessionId: 'session-1' }, 'test-jwt-secret', {
    expiresIn: '1h',
  });

const createMockTokenProvider = (): Partial<ITokenProvider> => ({
  createSession: jest.fn().mockResolvedValue({
    accessToken: buildSignedAccessToken(),
    refreshToken: 'refresh-token-456',
  }),
});

describe('createSignupOrgController', () => {
  const defaultConfig = { defaultOrgRole: 'CARRIER' };
  let mockEventBus: ReturnType<typeof createMockEventBus>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockTokenProvider: ReturnType<typeof createMockTokenProvider>;
  let mockSignupOrganization: jest.Mock;
  let mockRes: ReturnType<typeof createMockRes>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus = createMockEventBus();
    mockLogger = createMockLogger();
    mockTokenProvider = createMockTokenProvider();
    mockSignupOrganization = jest.fn().mockResolvedValue(buildSignupResult());
    mockRes = createMockRes();
  });

  const callController = async (
    reqBody: SignupOrgInput = buildSignupInput(),
    overrides?: {
      signupOrganization?: jest.Mock;
      eventBus?: ReturnType<typeof createMockEventBus>;
      logger?: ReturnType<typeof createMockLogger>;
      config?: { defaultOrgRole: string };
    },
  ) => {
    const req = createMockReq(reqBody);
    const handler = createSignupOrgController({
      tokenProviderInstance: mockTokenProvider as ITokenProvider,
      signupOrganization: overrides?.signupOrganization ?? mockSignupOrganization,
      eventBus: (overrides?.eventBus ?? mockEventBus) as EventBus,
      logger: (overrides?.logger ?? mockLogger) as Logger,
      config: overrides?.config ?? defaultConfig,
    });

    await handler(req as Request, mockRes as Response, jest.fn());
    return { req, res: mockRes };
  };

  it('publishes organization.created event after successful signup', async () => {
    await callController();

    expect(mockEventBus.publish).toHaveBeenCalledWith('organization.created', {
      orgId: 'org-1',
      orgName: 'Acme Logistics',
      orgRole: 'CARRIER',
      userId: 'user-1',
      userEmail: 'owner@example.com',
      customMetadata: {},
    });
  });

  it('publishes event with orgRole from signupData when provided', async () => {
    const inputWithRole = buildSignupInput({ orgRole: 'BROKER' });

    await callController(inputWithRole);

    const publishCall = mockEventBus.publish.mock.calls[0];
    expect(publishCall[1].orgRole).toBe('BROKER');
  });

  it('publishes event with default orgRole from config when not in signupData', async () => {
    const inputWithoutRole = buildSignupInput();
    delete inputWithoutRole.orgRole;

    await callController(inputWithoutRole);

    const publishCall = mockEventBus.publish.mock.calls[0];
    expect(publishCall[1].orgRole).toBe('CARRIER');
  });

  it('publishes event with customMetadata from signupData when provided', async () => {
    const metadata = { source: 'referral', campaign: 'spring-2026' };
    const inputWithMetadata = buildSignupInput({ customMetadata: metadata });

    await callController(inputWithMetadata);

    const publishCall = mockEventBus.publish.mock.calls[0];
    expect(publishCall[1].customMetadata).toEqual(metadata);
  });

  it('publishes event with empty object as default when customMetadata is not provided', async () => {
    const inputWithoutMetadata = buildSignupInput();
    delete inputWithoutMetadata.customMetadata;

    await callController(inputWithoutMetadata);

    const publishCall = mockEventBus.publish.mock.calls[0];
    expect(publishCall[1].customMetadata).toEqual({});
  });

  it('does not block response when eventBus.publish fails', async () => {
    const failingEventBus = createMockEventBus();
    failingEventBus.publish.mockReturnValue(
      Promise.reject(new Error('RabbitMQ connection lost')),
    );

    await callController(buildSignupInput(), { eventBus: failingEventBus });

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalled();
  });

  it('still returns success response even if publish throws', async () => {
    const failingEventBus = createMockEventBus();
    failingEventBus.publish.mockReturnValue(
      Promise.reject(new Error('publish exploded')),
    );

    await callController(buildSignupInput(), { eventBus: failingEventBus });

    expect(mockRes.status).toHaveBeenCalledWith(201);
    const jsonArg = (mockRes.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.message).toBe('Signup successful');
    expect(jsonArg.user.userId).toBe('user-1');
    expect(jsonArg.tenant.tenantId).toBe('org-1');
  });

  it('logs error when eventBus.publish fails', async () => {
    const publishError = new Error('connection refused');
    const failingEventBus = createMockEventBus();
    failingEventBus.publish.mockReturnValue(Promise.reject(publishError));

    await callController(buildSignupInput(), { eventBus: failingEventBus });

    // Allow the .catch handler to execute
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to publish organization.created event',
      { error: publishError },
    );
  });

  it('returns 201 status with transformed response on success', async () => {
    await callController();

    expect(mockRes.status).toHaveBeenCalledWith(201);
    const jsonArg = (mockRes.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.message).toBe('Signup successful');
    expect(jsonArg.user.email).toBe('owner@example.com');
    expect(jsonArg.tenant.slug).toBe('acme-logistics');
  });

  it('includes accessTokenExpiresAt (ISO 8601) matching the issued JWT exp', async () => {
    await callController();

    const accessToken = await (mockTokenProvider.createSession as jest.Mock).mock.results[0].value;
    const decoded = jwt.decode(accessToken.accessToken) as { exp: number };
    const expectedIso = new Date(decoded.exp * 1000).toISOString();

    const jsonArg = (mockRes.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.accessTokenExpiresAt).toBe(expectedIso);
  });
});
