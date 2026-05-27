import type { Request } from 'express';

interface LoginRequestInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const mapLoginRequest = (req: Request): LoginRequestInput => {
  const { email, password, rememberMe } = req.body as {
    email: string;
    password: string;
    rememberMe?: boolean;
  };

  return {
    email: email.toLowerCase().trim(),
    password,
    rememberMe: rememberMe === true,
  };
};
