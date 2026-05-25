import type { ComplianceForCarrier } from '../../services/derivedComplianceBatch';
import type { OnboardingDetail } from '../../types/onboardingDetailTypes';

export interface CarrierOnboardingDetailResponse {
  carrier: Record<string, unknown>;
  session: Record<string, unknown> | null;
  vehicles: Record<string, unknown>[];
  drivers: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  lanePreferences?: Record<string, unknown>;
}

/**
 * When a compute result is supplied, overlay the seven legacy compliance
 * projection fields on the `carrier` payload so the response shape stays the
 * same but the values come from on-read derivation, not the cached row.
 */
export const toOnboardingDetailResponse = (
  detail: OnboardingDetail,
  compliance?: ComplianceForCarrier,
): CarrierOnboardingDetailResponse => {
  const carrier =
    compliance === undefined
      ? detail.carrier
      : {
          ...detail.carrier,
          insuranceCertOnFile: compliance.insurance.onFile,
          insuranceExpiry: compliance.insurance.expiresAt,
          insuranceWarning: compliance.insurance.warning,
          dispatchAgreementOnFile: compliance.agreement.onFile,
          dispatchAgreementSignedAt: compliance.agreement.signedAt,
          signedAgreementId: compliance.agreement.signedAgreementId,
          w9OnFile: compliance.w9.onFile,
          carrierPacketOnFile: compliance.carrierPacket.onFile,
        };
  return {
    carrier,
    session: detail.session,
    vehicles: detail.vehicles,
    drivers: detail.drivers,
    documents: detail.documents,
    ...(detail.lanePreferences !== undefined && {
      lanePreferences: detail.lanePreferences,
    }),
  };
};
