import type { Request } from 'express';

interface ConfirmForgotPasswordInput {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export const mapConfirmForgotPasswordRequest = (req: Request): ConfirmForgotPasswordInput => ({
  email: req.body.email,
  confirmationCode: req.body.confirmationCode,
  newPassword: req.body.newPassword,
});
