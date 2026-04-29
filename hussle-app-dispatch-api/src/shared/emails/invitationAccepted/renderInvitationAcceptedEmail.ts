import { render } from '@react-email/components';
import InvitationAcceptedEmail from './InvitationAcceptedEmail';

export interface InvitationAcceptedEmailData {
  inviteeName: string;
  inviteeEmail: string;
  orgName: string;
  role: string;
  teamSettingsUrl: string;
}

export const renderInvitationAcceptedEmail = async (
  data: InvitationAcceptedEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `${data.inviteeName} has joined ${data.orgName}`,
  html: await render(InvitationAcceptedEmail(data)),
});
