import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import CtaButton from '../shared/CtaButton';
import { colors, textBody } from '../shared/emailStyles';
import type { InvitationEmailData } from './renderInvitationEmail';

const InvitationEmail = ({
  inviteeName,
  inviterName,
  orgName,
  role,
  inviteUrl,
  expiresAt,
}: InvitationEmailData) => (
  <EmailLayout
    preview={`You've been invited to join ${orgName}`}
    headerTitle="You're Invited!"
    headerSubtitle={orgName}
  >
    <Text style={textBody}>Hi {inviteeName},</Text>

    <Text style={textBody}>
      <strong>{inviterName}</strong> has invited you to join <strong>{orgName}</strong> as a{' '}
      <strong>{role}</strong> on Hussle Dispatch.
    </Text>

    <Text style={textBody}>
      Click the button below to accept the invitation and set up your account.
    </Text>

    <CtaButton href={inviteUrl}>Accept Invitation</CtaButton>

    <Text style={expirationNote}>This invitation expires on {expiresAt}.</Text>
  </EmailLayout>
);

export default InvitationEmail;

const expirationNote: React.CSSProperties = {
  color: colors.grey500,
  fontSize: '12px',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
};
