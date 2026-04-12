import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import CtaButton from '../shared/CtaButton';
import { colors, textBody } from '../shared/emailStyles';
import type { CarrierInviteEmailData } from './renderCarrierInviteEmail';

const CarrierInviteEmail = ({
  carrierName,
  organizationName,
  portalUrl,
  message,
}: CarrierInviteEmailData) => (
  <EmailLayout
    preview={`You've been invited to onboard with ${organizationName}`}
    headerTitle="Welcome Aboard!"
    headerSubtitle={organizationName}
  >
    <Text style={textBody}>Hi {carrierName},</Text>

    <Text style={textBody}>
      <strong>{organizationName}</strong> has invited you to complete your carrier onboarding. Click
      the button below to get started.
    </Text>

    {message ? <Text style={customMessage}>{message}</Text> : null}

    <CtaButton href={portalUrl}>Start Onboarding</CtaButton>
  </EmailLayout>
);

export default CarrierInviteEmail;

const customMessage: React.CSSProperties = {
  color: colors.grey700,
  fontSize: '14px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '0 0 24px 0',
  padding: '12px 16px',
  borderLeft: `3px solid ${colors.primaryLight}`,
};
