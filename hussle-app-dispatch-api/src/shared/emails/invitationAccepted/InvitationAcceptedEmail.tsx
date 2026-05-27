import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import CtaButton from '../shared/CtaButton';
import DataTable from '../shared/DataTable';
import { textBody } from '../shared/emailStyles';
import type { InvitationAcceptedEmailData } from './renderInvitationAcceptedEmail';

const InvitationAcceptedEmail = ({
  inviteeName,
  inviteeEmail,
  orgName,
  role,
  teamSettingsUrl,
}: InvitationAcceptedEmailData) => (
  <EmailLayout
    preview={`${inviteeName} has joined ${orgName}`}
    headerTitle="New Team Member"
    headerSubtitle={orgName}
  >
    <Text style={textBody}>
      <strong>{inviteeName}</strong> has accepted the invitation and joined{' '}
      <strong>{orgName}</strong>.
    </Text>

    <DataTable
      rows={[
        { label: 'Name', value: inviteeName },
        { label: 'Email', value: inviteeEmail },
        { label: 'Role', value: role },
      ]}
    />

    <CtaButton href={teamSettingsUrl}>View Team Settings</CtaButton>
  </EmailLayout>
);

export default InvitationAcceptedEmail;
