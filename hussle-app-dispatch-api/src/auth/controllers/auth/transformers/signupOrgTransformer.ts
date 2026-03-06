import type { SignupOrgResult } from '../../../types/signupOrgTypes';

export interface SignupOrgResponse extends SignupOrgResult {
  message: string;
}

export const toSignupOrgResponse = (result: SignupOrgResult): SignupOrgResponse => ({
  message: 'Signup successful',
  ...result,
});
