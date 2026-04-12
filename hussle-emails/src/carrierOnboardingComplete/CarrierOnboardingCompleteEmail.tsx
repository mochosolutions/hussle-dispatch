import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import CtaButton from '../shared/CtaButton';
import { textBody } from '../shared/emailStyles';
import type { CarrierOnboardingCompleteEmailData } from './renderCarrierOnboardingCompleteEmail';

const CarrierOnboardingCompleteEmail = ({
  carrierName,
  organizationName,
  reviewUrl,
}: CarrierOnboardingCompleteEmailData) => (
  <EmailLayout
    preview={`${carrierName} has completed onboarding`}
    headerTitle="Onboarding Complete"
    headerSubtitle={organizationName}
  >
    <Text style={textBody}>
      <strong>{carrierName}</strong> has completed their carrier onboarding and is ready for your
      review.
    </Text>

    <Text style={textBody}>
      Please review their application and supporting documents to approve or reject their
      onboarding.
    </Text>

    <CtaButton href={reviewUrl}>Review Application</CtaButton>
  </EmailLayout>
);

export default CarrierOnboardingCompleteEmail;
