import type { Request } from 'express';

interface ResendConfirmationCodeInput {
  email: string;
}

export const mapResendConfirmationCodeRequest = (req: Request): ResendConfirmationCodeInput => ({
  email: req.body.email,
});
