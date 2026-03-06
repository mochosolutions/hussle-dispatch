import type { Request, RequestHandler, Response } from 'express';
import { cognitoProvider } from '../../providers/authProvider';
import { confirmForgotPasswordService } from '../../services';
import { mapConfirmForgotPasswordRequest } from './mappers/mapConfirmForgotPasswordRequest';

interface ConfirmForgotPasswordControllerDeps {
  getAuthProvider: () => Promise<ReturnType<typeof cognitoProvider>>;
}

export const createConfirmForgotPasswordController = ({
  getAuthProvider,
}: ConfirmForgotPasswordControllerDeps): RequestHandler => {
  return async (req: Request, res: Response) => {
    const { email, confirmationCode, newPassword } = mapConfirmForgotPasswordRequest(req);
    const authProvider = await getAuthProvider();

    await confirmForgotPasswordService(
      {
        email,
        newPassword,
        code: confirmationCode,
      },
      { authProvider },
    );

    return res.status(200).json({ message: 'Password reset successfully' });
  };
};
