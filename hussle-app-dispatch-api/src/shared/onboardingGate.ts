import { CARRIER_TYPES } from './constants/carrierTypes';
import type { CarrierType } from './constants/carrierTypes';

export interface CarrierOnboardingInput {
  carrierType: CarrierType;
  dispatchAgreementOnFile: boolean;
  insuranceCertOnFile: boolean;
  insuranceExpiry: Date | null;
  w9OnFile: boolean;
}

export interface CarrierOnboardingResult {
  allowed: boolean;
  missingDocuments: string[];
}

/**
 * Determines whether a carrier is allowed to be assigned to a load.
 *
 * COMPANY_ASSET carriers always pass.
 * EXTERNAL_CARRIER carriers must have dispatch agreement, valid insurance, and W-9.
 * OWNER_OPERATOR is rejected with a clear message (decision X-001).
 */
export const checkCarrierOnboarding = (
  input: CarrierOnboardingInput,
): CarrierOnboardingResult => {
  if (input.carrierType === CARRIER_TYPES.COMPANY_ASSET) {
    return { allowed: true, missingDocuments: [] };
  }

  if (input.carrierType === CARRIER_TYPES.OWNER_OPERATOR) {
    return { allowed: false, missingDocuments: ['Owner-operator support coming soon'] };
  }

  // EXTERNAL_CARRIER — collect all missing documents
  const missingDocuments: string[] = [];

  if (!input.dispatchAgreementOnFile) {
    missingDocuments.push('Signed Dispatch Agreement');
  }

  if (!input.insuranceCertOnFile) {
    missingDocuments.push('Certificate of Insurance');
  } else if (input.insuranceExpiry !== null && input.insuranceExpiry < new Date()) {
    const expiryDateString = input.insuranceExpiry.toISOString().split('T')[0];
    missingDocuments.push(`Insurance expired on ${expiryDateString}`);
  }

  if (!input.w9OnFile) {
    missingDocuments.push('W-9');
  }

  return {
    allowed: missingDocuments.length === 0,
    missingDocuments,
  };
};
