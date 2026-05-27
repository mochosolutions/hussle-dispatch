import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import { colors, textBody } from '../shared/emailStyles';
import type { CarrierRejectedEmailData } from './renderCarrierRejectedEmail';

const CarrierRejectedEmail = ({
  carrierName,
  organizationName,
  rejectionReason,
}: CarrierRejectedEmailData) => (
  <EmailLayout
    preview={`Update on your application with ${organizationName}`}
    headerTitle="Application Update"
    headerSubtitle={organizationName}
  >
    <Text style={textBody}>Hi {carrierName},</Text>

    <Text style={textBody}>
      Thank you for your interest in working with <strong>{organizationName}</strong>. After
      reviewing your application, we are unable to approve it at this time.
    </Text>

    <Text style={reasonBox}>{rejectionReason}</Text>

    <Text style={textBody}>
      If you have any questions or believe this decision was made in error, please reach out to{' '}
      {organizationName} directly.
    </Text>
  </EmailLayout>
);

export default CarrierRejectedEmail;

const reasonBox: React.CSSProperties = {
  color: colors.grey800,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
  padding: '12px 16px',
  backgroundColor: colors.grey100,
  borderLeft: `3px solid ${colors.grey400}`,
  borderRadius: '4px',
};
