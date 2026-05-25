import type { PaginationMeta } from '@/shared/responseEnvelope';
import type { ComplianceForCarrier } from '../../services/derivedComplianceBatch';
import type { InsuranceWarning } from '../../services/derivedCompliance';
import type {
  CarrierResponse,
  CarrierServiceOutput,
  CarrierWithAssetsResponse,
  CarrierWithAssetsServiceOutput,
} from '../../types/carrierTypes';

/**
 * Source-of-truth compliance projection on the response. When a compute result
 * is provided, the seven legacy Carrier projection columns (and the
 * insuranceWarning bucket) are sourced from the derived state instead of the
 * cached row, preserving the existing response field names and types so
 * downstream UI does not change. When `compliance` is undefined the legacy
 * carrier-row values flow through unchanged (used during incremental rollout).
 */
const overlayCompliance = (
  carrier: CarrierServiceOutput,
  compliance: ComplianceForCarrier | undefined,
): CarrierServiceOutput => {
  if (compliance === undefined) {
    return carrier;
  }
  // Map the derived insurance warning union back onto the response's narrower
  // legacy enum (it omits `null` because `null` is allowed at the field level).
  const warning: InsuranceWarning = compliance.insurance.warning;
  return {
    ...carrier,
    insuranceCertOnFile: compliance.insurance.onFile,
    insuranceExpiry: compliance.insurance.expiresAt,
    dispatchAgreementOnFile: compliance.agreement.onFile,
    dispatchAgreementSignedAt: compliance.agreement.signedAt,
    signedAgreementId: compliance.agreement.signedAgreementId,
    // Existing UI consumes `insuranceWarning` as a tri-state — keep the bucket
    // semantics identical (EXPIRED / 7_DAY / 30_DAY / null).
    insuranceWarning:
      warning === '30_DAY' || warning === '7_DAY' || warning === 'EXPIRED' ? warning : null,
  };
};

export const toCarrierResponse = (
  carrier: CarrierServiceOutput,
  compliance?: ComplianceForCarrier,
): CarrierResponse => {
  const enriched = overlayCompliance(carrier, compliance);
  return {
    ...enriched,
    organizationId: enriched.managedByOrgId,
  };
};

export const toCarrierListResponse = (
  carriers: CarrierServiceOutput[],
  complianceById?: Map<string, ComplianceForCarrier>,
): CarrierResponse[] =>
  carriers.map((carrier) => toCarrierResponse(carrier, complianceById?.get(carrier.id)));

export const toCarrierListEnvelope = (
  carriers: CarrierServiceOutput[],
  meta: PaginationMeta,
  complianceById?: Map<string, ComplianceForCarrier>,
): { data: CarrierResponse[]; meta: PaginationMeta } => ({
  data: toCarrierListResponse(carriers, complianceById),
  meta,
});

export const toCarrierWithAssetsResponse = (
  carrier: CarrierWithAssetsServiceOutput,
  compliance?: ComplianceForCarrier,
): CarrierWithAssetsResponse => ({
  ...toCarrierResponse(carrier, compliance),
  drivers: carrier.drivers,
  vehicles: carrier.vehicles,
});
