import InvitationAcceptedEmail from '../src/invitationAccepted/InvitationAcceptedEmail';
import type { InvitationAcceptedEmailData } from '../src/invitationAccepted/renderInvitationAcceptedEmail';

InvitationAcceptedEmail.PreviewProps = {
  inviteeName: 'James Rivera',
  inviteeEmail: 'james.rivera@example.com',
  orgName: 'Summit Transport LLC',
  role: 'Driver',
  teamSettingsUrl: 'https://app.hussle.com/settings/team',
} satisfies InvitationAcceptedEmailData;

export default InvitationAcceptedEmail;
