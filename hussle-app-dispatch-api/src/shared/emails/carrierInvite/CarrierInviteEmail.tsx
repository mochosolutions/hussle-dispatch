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
  documents,
}: CarrierInviteEmailData) => (
  <EmailLayout
    preview={`You've been invited to onboard with ${organizationName}`}
    headerTitle="Welcome Aboard!"
    headerSubtitle={organizationName}
  >
    <Text style={textBody}>Hi {carrierName},</Text>

    <Text style={textBody}>
      <strong>{organizationName}</strong> has invited you to complete your carrier onboarding. The
      portal will guide you through a few short steps and let you upload the required documents.
    </Text>

    <Text style={textBody}>
      <strong>Have these documents ready before you start</strong> so you can finish in one sitting:
    </Text>

    <ul style={documentList}>
      {documents.map((doc) => (
        <li key={doc.type} style={documentItem}>
          <strong style={documentLabel}>{doc.label}</strong>
          <span style={documentHint}>{doc.hint}</span>
        </li>
      ))}
    </ul>

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

const documentList: React.CSSProperties = {
  margin: '0 0 24px 0',
  padding: '0 0 0 20px',
};

const documentItem: React.CSSProperties = {
  color: colors.grey700,
  fontSize: '14px',
  lineHeight: '1.6',
  marginBottom: '8px',
};

const documentLabel: React.CSSProperties = {
  display: 'block',
  color: colors.grey900,
};

const documentHint: React.CSSProperties = {
  display: 'block',
  color: colors.grey700,
};
