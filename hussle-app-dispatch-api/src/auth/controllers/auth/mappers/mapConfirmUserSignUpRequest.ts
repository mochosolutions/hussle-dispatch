import type { Request } from 'express';

interface ConfirmUserSignUpInput {
  email: string;
  confirmationCode: string;
}

export const mapConfirmUserSignUpRequest = (req: Request): ConfirmUserSignUpInput => ({
  email: req.body.email,
  confirmationCode: req.body.confirmationCode,
});
