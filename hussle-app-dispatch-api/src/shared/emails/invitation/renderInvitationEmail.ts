import { render } from '@react-email/components';
import InvitationEmail from './InvitationEmail';

export interface InvitationEmailData {
  inviteeName: string;
  inviterName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

export const renderInvitationEmail = async (
  data: InvitationEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `You've been invited to join ${data.orgName}`,
  html: await render(InvitationEmail(data)),
});
