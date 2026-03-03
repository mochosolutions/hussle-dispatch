import type { NextFunction, Request, Response } from 'express';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { cognitoProvider } from '../../providers/authProvider';
import { resendConfirmationCodeService } from '../../services';

export const resendConfirmationCodeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });
    await resendConfirmationCodeService({ email }, { authProvider });
    return res.status(200).json({ message: 'Confirmation code resent successfully' });
  } catch (error) {
    return next(error);
  }
};

export default resendConfirmationCodeController;
