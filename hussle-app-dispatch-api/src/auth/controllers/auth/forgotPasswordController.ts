import type { Request, RequestHandler, Response } from 'express';
import { cognitoProvider } from '../../providers/authProvider';
import { forgotPasswordService } from '../../services';
import { mapForgotPasswordRequest } from './mappers/mapForgotPasswordRequest';

interface ForgotPasswordControllerDeps {
  getAuthProvider: () => Promise<ReturnType<typeof cognitoProvider>>;
}

export const createForgotPasswordController = ({
  getAuthProvider,
}: ForgotPasswordControllerDeps): RequestHandler => {
  return async (req: Request, res: Response) => {
    const { email } = mapForgotPasswordRequest(req);
    const authProvider = await getAuthProvider();

    await forgotPasswordService({ email }, { authProvider });
    return res.status(200).json({ message: 'Password reset code sent successfully' });
  };
};
