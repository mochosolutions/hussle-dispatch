import InvitationEmail from '../src/invitation/InvitationEmail';
import type { InvitationEmailData } from '../src/invitation/renderInvitationEmail';

InvitationEmail.PreviewProps = {
  inviterName: 'Sarah Chen',
  orgName: 'Summit Transport LLC',
  role: 'Dispatcher',
  inviteUrl: 'https://app.hussle.com/invite/abc123',
  expiresAt: 'April 1, 2026',
} satisfies InvitationEmailData;

export default InvitationEmail;
