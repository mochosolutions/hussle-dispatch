import type { NextFunction, Request, Response } from 'express';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { cognitoProvider } from '../../providers/authProvider';
import { confirmUserService } from '../../services';

export const confirmUserSignUpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, confirmationCode } = req.body;
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });
    await confirmUserService({ username: email, confirmationCode }, { authProvider });
    return res.status(200).json({ message: 'User confirmed successfully' });
  } catch (error) {
    return next(error);
  }
};

export default confirmUserSignUpController;
