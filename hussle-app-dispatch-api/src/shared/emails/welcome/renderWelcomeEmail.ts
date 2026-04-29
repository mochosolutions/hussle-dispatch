import { render } from '@react-email/components';
import WelcomeEmail from './WelcomeEmail';

export interface WelcomeEmailData {
  firstName: string;
  orgName: string;
  orgRole: 'CARRIER' | 'DISPATCH_COMPANY';
  dashboardUrl: string;
}

export const renderWelcomeEmail = async (
  data: WelcomeEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Welcome to Hussle Dispatch, ${data.firstName}!`,
  html: await render(WelcomeEmail(data)),
});
