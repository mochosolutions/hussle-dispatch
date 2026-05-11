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
 * Determines whether a carrier currently has valid documents to be assigned to a load.
 *
 * COMPANY_ASSET — own fleet, no dispatch agreement or W-9 (org doesn't sign with itself);
 *   only insurance must be on file and unexpired.
 * EXTERNAL_CARRIER / LEASED_CARRIER — full document set required.
 */
export const checkCarrierOnboarding = (
  input: CarrierOnboardingInput,
): CarrierOnboardingResult => {
  const missingDocuments: string[] = [];

  if (!input.insuranceCertOnFile) {
    missingDocuments.push('Certificate of Insurance');
  } else if (input.insuranceExpiry !== null && input.insuranceExpiry < new Date()) {
    const expiryDateString = input.insuranceExpiry.toISOString().split('T')[0];
    missingDocuments.push(`Insurance expired on ${expiryDateString}`);
  }

  if (input.carrierType !== CARRIER_TYPES.COMPANY_ASSET) {
    if (!input.dispatchAgreementOnFile) {
      missingDocuments.push('Signed Dispatch Agreement');
    }
    if (!input.w9OnFile) {
      missingDocuments.push('W-9');
    }
  }

  return {
    allowed: missingDocuments.length === 0,
    missingDocuments,
  };
};
