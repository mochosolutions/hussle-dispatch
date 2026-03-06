import type { Request } from 'express';

interface LoginRequestInput {
  email: string;
  password: string;
}

export const mapLoginRequest = (req: Request): LoginRequestInput => {
  const { email, password } = req.body as { email: string; password: string };

  return {
    email: email.toLowerCase().trim(),
    password,
  };
};
