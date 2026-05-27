import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import CtaButton from '../shared/CtaButton';
import { textBody } from '../shared/emailStyles';
import type { WelcomeEmailData } from './renderWelcomeEmail';

const carrierSteps = [
  'Add your vehicles and equipment',
  'Invite your team members',
  'Accept and manage loads from your dispatchers',
];

const dispatchSteps = [
  'Add carriers to your network',
  'Create and dispatch loads',
  'Invite your team members',
];

const WelcomeEmail = ({ firstName, orgName, orgRole, dashboardUrl }: WelcomeEmailData) => {
  const steps = orgRole === 'CARRIER' ? carrierSteps : dispatchSteps;

  return (
    <EmailLayout
      preview={`Welcome to Hussle Dispatch, ${firstName}!`}
      headerTitle={`Welcome to Hussle Dispatch!`}
      headerSubtitle={orgName}
    >
      <Text style={textBody}>
        Hi {firstName}, your organization <strong>{orgName}</strong> is all set up and ready to go.
      </Text>

      <Text style={textBody}>Here are some next steps to get started:</Text>

      <Text style={listStyle}>
        {steps.map((step, index) => (
          <span key={step}>
            {index + 1}. {step}
            <br />
          </span>
        ))}
      </Text>

      <CtaButton href={dashboardUrl}>Go to Dashboard</CtaButton>
    </EmailLayout>
  );
};

export default WelcomeEmail;

const listStyle: React.CSSProperties = {
  ...textBody,
  paddingLeft: '8px',
};
