import type { Request, RequestHandler, Response } from 'express';
import { cognitoProvider } from '../../providers/authProvider';
import { confirmUserService } from '../../services';
import { mapConfirmUserSignUpRequest } from './mappers/mapConfirmUserSignUpRequest';

interface ConfirmUserSignUpControllerDeps {
  getAuthProvider: () => Promise<ReturnType<typeof cognitoProvider>>;
}

export const createConfirmUserSignUpController = ({
  getAuthProvider,
}: ConfirmUserSignUpControllerDeps): RequestHandler => {
  return async (req: Request, res: Response) => {
    const { email, confirmationCode } = mapConfirmUserSignUpRequest(req);
    const authProvider = await getAuthProvider();

    await confirmUserService({ username: email, confirmationCode }, { authProvider });

    return res.status(200).json({ message: 'User confirmed successfully' });
  };
};
