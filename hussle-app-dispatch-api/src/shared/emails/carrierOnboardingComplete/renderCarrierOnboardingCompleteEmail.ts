import { render } from '@react-email/components';
import CarrierOnboardingCompleteEmail from './CarrierOnboardingCompleteEmail';

export interface CarrierOnboardingCompleteEmailData {
  carrierName: string;
  organizationName: string;
  reviewUrl: string;
}

export const renderCarrierOnboardingCompleteEmail = async (
  data: CarrierOnboardingCompleteEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `${data.carrierName} has completed onboarding`,
  html: await render(CarrierOnboardingCompleteEmail(data)),
});
