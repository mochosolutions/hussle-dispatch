import type { AgreementRepoPort } from '@/agreements/types/agreementRepoPort';
import type { DocumentRepoPort, DocumentWithUploader } from '@/documents/types/documentTypes';

/**
 * Pure compute functions that derive Carrier compliance state on read.
 *
 * These replace the cached `Carrier.insuranceCertOnFile`, `Carrier.insuranceExpiry`,
 * `Carrier.w9OnFile`, `Carrier.carrierPacketOnFile`, `Carrier.dispatchAgreementOnFile`,
 * `Carrier.signedAgreementId`, and `Carrier.dispatchAgreementSignedAt` columns.
 *
 * Each function is port-injected — no direct Prisma access — so callers control
 * scope and tests stay fast. For list endpoints prefer `computeCompliancesForCarriers`
 * (batch) over per-row calls here.
 */

export type InsuranceWarning = 'EXPIRED' | '7_DAY' | '30_DAY' | null;

export interface InsuranceStatus {
  onFile: boolean;
  expiresAt: Date | null;
  warning: InsuranceWarning;
}

export interface DocumentOnFileStatus {
  onFile: boolean;
}

export interface AgreementStatus {
  onFile: boolean;
  signedAgreementId: string | null;
  signedAt: Date | null;
}

export interface DerivedComplianceDeps {
  documentRepo: Pick<DocumentRepoPort, 'findManyForCompliance'>;
  agreementRepo: Pick<AgreementRepoPort, 'findManySigned'>;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Map an insurance expiry date to a warning bucket.
 *
 * `EXPIRED` when `expiresAt < now`.
 * `7_DAY`  when `expiresAt < now + 7 days` (and not already expired).
 * `30_DAY` when `expiresAt < now + 30 days` (and outside the 7-day window).
 * `null`   when no expiry on file or expiry > 30 days out.
 *
 * Dates are compared as UTC instants (`Date#getTime()`), so timezone of the
 * caller never affects the bucket.
 */
export const deriveInsuranceWarning = (
  expiresAt: Date | null,
  now: Date = new Date(),
): InsuranceWarning => {
  if (expiresAt === null) {
    return null;
  }
  const expiryMs = expiresAt.getTime();
  const nowMs = now.getTime();
  if (expiryMs < nowMs) {
    return 'EXPIRED';
  }
  if (expiryMs < nowMs + 7 * MS_PER_DAY) {
    return '7_DAY';
  }
  if (expiryMs < nowMs + 30 * MS_PER_DAY) {
    return '30_DAY';
  }
  return null;
};

const pickLatestByCreatedAt = (docs: DocumentWithUploader[]): DocumentWithUploader | null => {
  if (docs.length === 0) {
    return null;
  }
  return docs.reduce((latest, candidate) =>
    candidate.createdAt.getTime() > latest.createdAt.getTime() ? candidate : latest,
  );
};

export const computeInsuranceStatus = async (
  carrierId: string,
  deps: DerivedComplianceDeps,
  now: Date = new Date(),
): Promise<InsuranceStatus> => {
  const docs = await deps.documentRepo.findManyForCompliance([carrierId], ['INSURANCE_CERT']);
  const latest = pickLatestByCreatedAt(docs);
  if (latest === null) {
    return { onFile: false, expiresAt: null, warning: null };
  }
  const expiresAt = latest.expiresAt;
  return {
    onFile: true,
    expiresAt,
    warning: deriveInsuranceWarning(expiresAt, now),
  };
};

export const computeW9Status = async (
  carrierId: string,
  deps: DerivedComplianceDeps,
): Promise<DocumentOnFileStatus> => {
  const docs = await deps.documentRepo.findManyForCompliance([carrierId], ['W9']);
  return { onFile: docs.length > 0 };
};

export const computeCarrierPacketStatus = async (
  carrierId: string,
  deps: DerivedComplianceDeps,
): Promise<DocumentOnFileStatus> => {
  const docs = await deps.documentRepo.findManyForCompliance([carrierId], ['CARRIER_PACKET']);
  return { onFile: docs.length > 0 };
};

export const computeAgreementStatus = async (
  carrierId: string,
  deps: DerivedComplianceDeps,
): Promise<AgreementStatus> => {
  const agreements = await deps.agreementRepo.findManySigned([carrierId]);
  if (agreements.length === 0) {
    return { onFile: false, signedAgreementId: null, signedAt: null };
  }
  // Repository returns `signedAt DESC`, but be defensive in case ordering changes.
  const latest = agreements.reduce((acc, candidate) => {
    const accMs = acc.signedAt?.getTime() ?? -Infinity;
    const candMs = candidate.signedAt?.getTime() ?? -Infinity;
    return candMs > accMs ? candidate : acc;
  });
  return {
    onFile: true,
    signedAgreementId: latest.id,
    signedAt: latest.signedAt,
  };
};
