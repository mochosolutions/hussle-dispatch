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
 * is provided, the response's `insuranceWarning` tri-state is sourced from the
 * derived state. When `compliance` is undefined the service-output value flows
 * through unchanged (used during incremental rollout). The five legacy Carrier
 * projection columns (insuranceCertOnFile, insuranceExpiry,
 * dispatchAgreementOnFile, dispatchAgreementSignedAt, signedAgreementId) have
 * been removed from the schema (US-06); consumers must derive them via the
 * shared compliance helpers.
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
