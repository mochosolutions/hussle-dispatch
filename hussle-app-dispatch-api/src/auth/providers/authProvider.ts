import { logger } from '@/shared/utils/logger';
import type { IAuthProvider, CognitoProviderDeps } from '../types/authProviderTypes';
import { authenticateUserCognito } from './cognitoProvider/authenticateUserCognito';
import { confirmForgotPassword as confirmForgotPasswordCognito } from './cognitoProvider/confirmForgotPassword';
import { confirmUserCognito } from './cognitoProvider/confirmUserCognito';
import { createUserCognito } from './cognitoProvider/createUserCognito';
import { deleteUserCognito, deleteUserManyCognito } from './cognitoProvider/deleteUserCognito';
import { forgotPassword as forgotPasswordCognito } from './cognitoProvider/forgotPasswordCognito';
import { logoutUserCognito } from './cognitoProvider/logoutUserCognito';
import { passwordChallengeCognito } from './cognitoProvider/passwordChallenge';
import { refreshToken as refreshTokenCognito } from './cognitoProvider/refreshToken';
import { resendCodeCognito } from './cognitoProvider/resendCodeCognito';
import { signUpUserCognito } from './cognitoProvider/signUpUserCognito';

export const cognitoProvider = ({
  client,
  userPoolId,
  clientId,
}: CognitoProviderDeps): IAuthProvider => ({
  createUser: async (args) => createUserCognito(args, { client, userPoolId }), // Admin invitations only
  signUpUser: async (args) => {
    logger.info('Signing up user via CognitoProvider signUpUser');
    return signUpUserCognito(args, { client, clientId });
  }, // Public self-service signup
  deleteUser: async (id: string) => deleteUserCognito(id, { client, userPoolId }),
  deleteUserMany: async (ids: string[]) => deleteUserManyCognito(ids, { client, userPoolId }),
  authenticateUser: async ({ username, password }) =>
    authenticateUserCognito({ username, password }, { client, clientId }),
  passwordChallenge: async ({ username, newPassword, session }): Promise<any> =>
    passwordChallengeCognito({ session, newPassword, username }, { clientId, client, userPoolId }),
  confirmUser: async ({
    username,
    confirmationCode,
  }: {
    username: string;
    confirmationCode: string;
  }) => confirmUserCognito({ confirmationCode, username }, { client, clientId }),

  resendConfirmationCode: async ({ email }) =>
    resendCodeCognito({ username: email }, { client, clientId }),
  logout: async ({ accessToken }) => logoutUserCognito({ accessToken }, { client }),
  forgotPassword: async ({ email }) => forgotPasswordCognito({ email }, { client, clientId }),
  confirmForgotPassword: async (args) => confirmForgotPasswordCognito(args, { client, clientId }),
  refreshToken: async ({ refreshToken }) =>
    refreshTokenCognito({ refreshToken }, { client, clientId }),
});
