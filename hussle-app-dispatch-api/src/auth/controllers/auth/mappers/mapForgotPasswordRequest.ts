import type { Request } from 'express';

interface ForgotPasswordInput {
  email: string;
}

export const mapForgotPasswordRequest = (req: Request): ForgotPasswordInput => ({
  email: req.body.email,
});
