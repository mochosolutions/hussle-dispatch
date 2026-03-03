import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import type { JwtPayload } from 'jsonwebtoken';
import type { AuthStatus } from '@/shared/constants/authConstants';
import type { Membership } from './membershipTypes';
import type { ITokenProvider } from './tokenProvider';
import type { User } from './user';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
export interface CreateUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserCognitoDeps {
  client: CognitoIdentityProviderClient;
  userPoolId: string;
}

export interface CognitoProviderDeps {
  client: CognitoIdentityProviderClient;
  clientId: string;
  userPoolId: string;
}

export interface AuthenticateUserInput {
  username: string;
  password: string;
}

export interface PasswordChallengeInput {
  username: string;
  newPassword: string;
  session: string;
}

export interface ResendConfirmCodeInput {
  email: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ConfirmForgotPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface ConfirmUserInput {
  username: string;
  confirmationCode: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
  userId: string;
  oldTokenId: string;
}

export interface LogoutInput {
  accessToken: string;
}

export interface IAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface SignUpUserResponse extends IAuthUser {
  codeDeliveryDetails?: {
    destination?: string;
    deliveryMedium?: string;
    attributeName?: string;
  };
}

export interface ConfirmForgotPasswordDeps {
  client: CognitoIdentityProviderClient;
  clientId: string;
}

export interface RefreshTokenDeps {
  client: CognitoIdentityProviderClient;
  clientId: string;
}

export interface ForgotPasswordDeps {
  client: CognitoIdentityProviderClient;
  clientId: string;
}

export interface AuthenticateUserCognitoDeps {
  client: CognitoIdentityProviderClient;
  clientId: string;
}

export interface AuthenticateUserResult {
  session?: string;
  orgs?: Membership[];
  user: Partial<User> & { organizationId?: string };
  status: AuthStatus;
  token?: {
    accessToken: string;
    refreshToken: string;
  };
  challengeName?: string;
}

export interface DeleteUserCognitoDeps {
  client: CognitoIdentityProviderClient;
  userPoolId: string;
}

export interface LogoutUserCognitoDeps {
  client: CognitoIdentityProviderClient;
}

export interface SignUpUserCognitoDeps {
  client: CognitoIdentityProviderClient;
  clientId: string;
}

export interface SignUpUserResponse extends IAuthUser {
  codeDeliveryDetails?: {
    destination?: string;
    deliveryMedium?: string;
    attributeName?: string;
  };
}

export interface AuthenticateUserServiceDeps {
  decodeToken: (token: string) => JwtPayload | null;
  authProvider: IAuthProvider;
  tokenProvider: ITokenProvider;
  findMemberByUserId: (userId: string, context?: any) => Promise<Membership[] | null>;
  findUserByExternalId: (externalId: string, context?: any) => Promise<User | null>;
}

export interface ConfirmForgotPasswordServiceDeps {
  authProvider: IAuthProvider;
}

export interface ConfirmUserServiceDeps {
  authProvider: IAuthProvider;
}

export interface DeleteOrgInput {
  organizationId: string;
}

export interface ForgotPasswordServiceDeps {
  authProvider: IAuthProvider;
}

export interface PasswordChallengeServiceDeps {
  authProvider: IAuthProvider;
}

export interface ResendConfirmDeps {
  authProvider: IAuthProvider;
}

export interface IAuthProvider {
  createUser: (args: CreateUserInput) => Promise<CreateUserResponse>; // Admin invitation flow only
  signUpUser: (args: CreateUserInput) => Promise<SignUpUserResponse>; // Public self-service signup
  authenticateUser: (args: AuthenticateUserInput) => Promise<AuthenticateUserResult>;
  deleteUser: (id: string) => Promise<{ id: string }>;
  passwordChallenge: (args: PasswordChallengeInput) => Promise<any>;
  confirmUser: (args: ConfirmUserInput) => Promise<{ success: boolean; message: string }>;
  resendConfirmationCode: (
    args: ResendConfirmCodeInput
  ) => Promise<{ success: boolean; message: string }>;
  logout: (args: LogoutInput) => Promise<any>;
  forgotPassword: (args: ForgotPasswordInput) => Promise<any>;
  confirmForgotPassword: (args: ConfirmForgotPasswordInput) => Promise<any>;
  refreshToken: (args: { refreshToken: string }) => Promise<any>;
  deleteUserMany: (ids: string[]) => Promise<{ ids: string[] }>;
}

export type AuthProviderFactory = (tenantId: string) => Promise<IAuthProvider>;
