import type { Request } from 'express';

interface PasswordChallengeInput {
  email: string;
  password: string;
  session: string;
  challengeName: string;
}

export const mapPasswordChallengeRequest = (req: Request): PasswordChallengeInput => ({
  email: req.body.email,
  password: req.body.password,
  session: req.body.session,
  challengeName: req.body.challengeName,
});
