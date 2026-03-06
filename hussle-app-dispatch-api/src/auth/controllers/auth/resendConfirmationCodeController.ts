import type { Request, RequestHandler, Response } from 'express';
import { cognitoProvider } from '../../providers/authProvider';
import { resendConfirmationCodeService } from '../../services';
import { mapResendConfirmationCodeRequest } from './mappers/mapResendConfirmationCodeRequest';

interface ResendConfirmationCodeControllerDeps {
  getAuthProvider: () => Promise<ReturnType<typeof cognitoProvider>>;
}

export const createResendConfirmationCodeController = ({
  getAuthProvider,
}: ResendConfirmationCodeControllerDeps): RequestHandler => {
  return async (req: Request, res: Response) => {
    const { email } = mapResendConfirmationCodeRequest(req);
    const authProvider = await getAuthProvider();
    await resendConfirmationCodeService({ email }, { authProvider });
    return res.status(200).json({ message: 'Confirmation code resent successfully' });
  };
};
