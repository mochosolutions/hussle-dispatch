import type { NextFunction, Request, Response } from 'express';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { cognitoProvider } from '../../providers/authProvider';
import { forgotPasswordService } from '../../services';

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });

    await forgotPasswordService({ email }, { authProvider });
    return res.status(200).json({ message: 'Password reset code sent successfully' });
  } catch (error) {
    return next(error);
  }
};
