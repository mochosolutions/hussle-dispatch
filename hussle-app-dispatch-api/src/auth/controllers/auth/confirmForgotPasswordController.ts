import type { NextFunction, Request, Response } from 'express';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { cognitoProvider } from '../../providers/authProvider';
import { confirmForgotPasswordService } from '../../services';

export const confirmForgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, confirmationCode, newPassword } = req.body;
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });

    await confirmForgotPasswordService(
      {
        email,
        newPassword,
        code: confirmationCode,
      },
      { authProvider }
    );
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return next(error);
  }
};
