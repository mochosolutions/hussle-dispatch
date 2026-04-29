import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import { textBody } from '../shared/emailStyles';
import type { CarrierApprovedEmailData } from './renderCarrierApprovedEmail';

const CarrierApprovedEmail = ({
  carrierName,
  organizationName,
}: CarrierApprovedEmailData) => (
  <EmailLayout
    preview={`Welcome to ${organizationName}!`}
    headerTitle="You're Approved!"
    headerSubtitle={organizationName}
  >
    <Text style={textBody}>Hi {carrierName},</Text>

    <Text style={textBody}>
      Congratulations! Your carrier application with <strong>{organizationName}</strong> has been
      approved.
    </Text>

    <Text style={textBody}>
      You are now an active carrier and can be dispatched loads. We look forward to working with you.
    </Text>
  </EmailLayout>
);

export default CarrierApprovedEmail;
