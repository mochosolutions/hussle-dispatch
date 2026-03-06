import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

export interface CreateUserParams {
  userPoolId: string;
  username: string;
  temporaryPassword?: string;
  userAttributes: { Name: string; Value: string }[];
}

export interface SignUpUserParams {
  clientId: string;
  username: string;
  temporaryPassword: string;
  userAttributes: { Name: string; Value: string }[];
}

export interface AuthenticateCognitoUserParams {
  username: string;
  password: string;
  clientId: string;
  client: CognitoIdentityProviderClient;
}

export interface AuthenticateResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  session?: string;
  challengeName: string;
  challengeParams: {
    userID: string;
    requiredAttributes: string | undefined;
    userAttributes: string | undefined;
  };
}

export interface UpdateUserAttributesParams {
  accessToken: string;
  userAttributes: { Name: string; Value: string }[];
}

export interface RefreshCognitoUserTokenParams {
  clientId: string;
  refreshToken: string;
}

export interface RespondToPasswordChallengeParams {
  username: string;
  newPassword: string;
  session: string;
  clientId: string;
}

export interface ConfirmCognitoUserParams {
  clientId: string;
  username: string;
  confirmationCode: string;
  client: CognitoIdentityProviderClient;
}

export interface ConfirmCognitoUserParams {
  username: string;
  confirmationCode: string;
  clientId: string;
}

export interface ResendConfirmationCodeParams {
  clientId: string;
  username: string;
}

export interface ForgotPasswordParams {
  clientId: string;
  username: string;
}

export interface ConfirmForgotPasswordParams {
  clientId: string;
  username: string;
  confirmationCode: string;
  newPassword: string;
}

export interface LogoutCognitoUserParams {
  accessToken: string;
}

export interface AdminCreateUserInCognitoParams {
  userPoolId: string;
  username: string;
  userAttributes: { Name: string; Value: string }[];
  messageAction?: 'SUPPRESS' | 'RESEND';
  temporaryPassword?: string;
  client: CognitoIdentityProviderClient;
}

export interface AdminSetUserPasswordParams {
  userPoolId: string;
  username: string;
  password: string;
  permanent?: boolean;
  client: CognitoIdentityProviderClient;
}

export interface CreateGroupParams {
  groupName: string;
  userPoolId: string;
  client: CognitoIdentityProviderClient;
}

export interface DeleteUserParams {
  username: string;
  userPoolId: string;
  client: CognitoIdentityProviderClient;
}

export interface AddUserToGroupParams {
  userPoolId: string;
  username: string;
  groupName: string;
  client: CognitoIdentityProviderClient;
}

export interface DeleteUserSubParams {
  subId: string;
  userPoolId: string;
  client: CognitoIdentityProviderClient;
}

export interface DeleteUserBySubArrayParams {
  subsArray: string[];
  userPoolId: string;
  client: CognitoIdentityProviderClient;
}
