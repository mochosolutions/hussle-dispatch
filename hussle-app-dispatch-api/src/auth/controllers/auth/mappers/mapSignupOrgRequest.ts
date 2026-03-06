import type { Request } from 'express';
import type { SignupOrgInput } from '../../../types/signupOrgTypes';

export const mapSignupOrgRequest = (req: Request): SignupOrgInput => {
  const {
    email,
    password,
    firstName,
    lastName,
    orgName,
    orgRole,
    orgVertical,
    customMetadata,
  } = req.body as {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    orgName: string;
    orgRole?: string;
    orgVertical?: string;
    customMetadata?: Record<string, unknown>;
  };

  return {
    email,
    password,
    firstName,
    lastName,
    orgName,
    orgRole,
    orgVertical,
    customMetadata,
  };
};
