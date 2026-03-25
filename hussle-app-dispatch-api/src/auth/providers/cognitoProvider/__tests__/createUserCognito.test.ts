import { createUserCognito } from '../createUserCognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type { CreateUserInput, CreateUserCognitoDeps } from '../../../types/authProviderTypes';

jest.mock('@/shared/utils/cognito', () => ({
  adminCreateUserInCognito: jest.fn(),
  adminSetUserPassword: jest.fn(),
  formatCognitoUser: jest.fn(),
  deleteUserFromCognito: jest.fn(),
}));

jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  adminCreateUserInCognito,
  adminSetUserPassword,
  formatCognitoUser,
  deleteUserFromCognito,
} from '@/shared/utils/cognito';

const mockAdminCreateUser = adminCreateUserInCognito as jest.Mock;
const mockSetPassword = adminSetUserPassword as jest.Mock;
const mockFormatUser = formatCognitoUser as jest.Mock;
const mockDeleteUser = deleteUserFromCognito as jest.Mock;

describe('createUserCognito', () => {
  const mockDeps: CreateUserCognitoDeps = {
    client: {} as CreateUserCognitoDeps['client'],
    userPoolId: 'us-east-1_test',
  };

  const baseInput: CreateUserInput = {
    email: 'test@example.com',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User',
  };

  const formattedUser = {
    id: 'sub-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates user and sets password successfully', async () => {
    // Arrange
    mockAdminCreateUser.mockResolvedValue({ User: { Username: 'test@example.com' } });
    mockFormatUser.mockReturnValue(formattedUser);
    mockSetPassword.mockResolvedValue({});

    // Act
    const result = await createUserCognito(baseInput, mockDeps);

    // Assert
    expect(result).toEqual(formattedUser);
    expect(mockAdminCreateUser).toHaveBeenCalledTimes(1);
    expect(mockSetPassword).toHaveBeenCalledWith({
      client: mockDeps.client,
      userPoolId: mockDeps.userPoolId,
      username: baseInput.email,
      password: baseInput.password,
      permanent: true,
    });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('cleans up Cognito user when password setting fails', async () => {
    // Arrange
    mockAdminCreateUser.mockResolvedValue({ User: { Username: 'test@example.com' } });
    mockFormatUser.mockReturnValue(formattedUser);
    mockSetPassword.mockRejectedValue(new Error('InvalidPasswordException'));

    // Act & Assert
    await expect(createUserCognito(baseInput, mockDeps)).rejects.toThrow(AuthRequestError);
    expect(mockDeleteUser).toHaveBeenCalledWith({
      client: mockDeps.client,
      userPoolId: mockDeps.userPoolId,
      username: 'test@example.com',
    });
  });

  it('does not attempt cleanup when user creation itself fails', async () => {
    // Arrange
    mockAdminCreateUser.mockRejectedValue(new Error('UsernameExistsException'));

    // Act & Assert
    await expect(createUserCognito(baseInput, mockDeps)).rejects.toThrow(AuthRequestError);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('skips password setting when no password provided', async () => {
    // Arrange
    const inputWithoutPassword: CreateUserInput = {
      email: 'test@example.com',
      password: '',
      firstName: 'Test',
      lastName: 'User',
    };
    mockAdminCreateUser.mockResolvedValue({ User: { Username: 'test@example.com' } });
    mockFormatUser.mockReturnValue(formattedUser);

    // Act
    const result = await createUserCognito(inputWithoutPassword, mockDeps);

    // Assert
    expect(result).toEqual(formattedUser);
    expect(mockSetPassword).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
