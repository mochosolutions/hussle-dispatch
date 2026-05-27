import type { Agreement } from '@/agreements/types/agreementTypes';
import type { AgreementRepoPort } from '@/agreements/types/agreementRepoPort';
import type {
  DocumentRepoPort,
  DocumentType,
  DocumentWithUploader,
} from '@/documents/types/documentTypes';
import {
  deriveInsuranceWarning,
  type AgreementStatus,
  type DocumentOnFileStatus,
  type InsuranceStatus,
} from './derivedCompliance';

/**
 * Per-carrier full compliance projection — the union of the four single-carrier
 * derived shapes. Returned by `computeCompliancesForCarriers` for list endpoints.
 */
export interface ComplianceForCarrier {
  insurance: InsuranceStatus;
  w9: DocumentOnFileStatus;
  carrierPacket: DocumentOnFileStatus;
  agreement: AgreementStatus;
}

export interface ComplianceBatchDeps {
  documentRepo: Pick<DocumentRepoPort, 'findManyForCompliance'>;
  agreementRepo: Pick<AgreementRepoPort, 'findManySigned'>;
}

const COMPLIANCE_DOC_TYPES: DocumentType[] = ['INSURANCE_CERT', 'W9', 'CARRIER_PACKET'];

const emptyCompliance = (): ComplianceForCarrier => ({
  insurance: { onFile: false, expiresAt: null, warning: null },
  w9: { onFile: false },
  carrierPacket: { onFile: false },
  agreement: { onFile: false, signedAgreementId: null, signedAt: null },
});

interface DocBucket {
  INSURANCE_CERT: DocumentWithUploader[];
  W9: DocumentWithUploader[];
  CARRIER_PACKET: DocumentWithUploader[];
}

const newBucket = (): DocBucket => ({
  INSURANCE_CERT: [],
  W9: [],
  CARRIER_PACKET: [],
});

const pickLatestByCreatedAt = (docs: DocumentWithUploader[]): DocumentWithUploader | null => {
  if (docs.length === 0) {
    return null;
  }
  return docs.reduce((latest, candidate) =>
    candidate.createdAt.getTime() > latest.createdAt.getTime() ? candidate : latest,
  );
};

const pickLatestAgreement = (agreements: Agreement[]): Agreement | null => {
  if (agreements.length === 0) {
    return null;
  }
  return agreements.reduce((acc, candidate) => {
    const accMs = acc.signedAt?.getTime() ?? -Infinity;
    const candMs = candidate.signedAt?.getTime() ?? -Infinity;
    return candMs > accMs ? candidate : acc;
  });
};

/**
 * Batch-compute the full derived compliance projection for every carrier in
 * `carrierIds`. Guarantees EXACTLY two queries (one document, one agreement)
 * regardless of input length — no N+1.
 *
 * Returns a Map keyed by carrierId. Every input carrierId is present in the
 * Map; carriers with no docs/agreements get `emptyCompliance()`.
 */
export const computeCompliancesForCarriers = async (
  carrierIds: string[],
  deps: ComplianceBatchDeps,
  now: Date = new Date(),
): Promise<Map<string, ComplianceForCarrier>> => {
  const result = new Map<string, ComplianceForCarrier>();

  if (carrierIds.length === 0) {
    return result;
  }

  // Seed result so every input carrier has a default projection.
  carrierIds.forEach((id) => {
    result.set(id, emptyCompliance());
  });

  // EXACTLY 2 queries.
  const [documents, agreements] = await Promise.all([
    deps.documentRepo.findManyForCompliance(carrierIds, COMPLIANCE_DOC_TYPES),
    deps.agreementRepo.findManySigned(carrierIds),
  ]);

  // Group documents by carrierId + type.
  const docsByCarrier = new Map<string, DocBucket>();
  documents.forEach((doc) => {
    if (doc.type !== 'INSURANCE_CERT' && doc.type !== 'W9' && doc.type !== 'CARRIER_PACKET') {
      return;
    }
    let bucket = docsByCarrier.get(doc.entityId);
    if (bucket === undefined) {
      bucket = newBucket();
      docsByCarrier.set(doc.entityId, bucket);
    }
    bucket[doc.type].push(doc);
  });

  // Group agreements by carrierId.
  const agreementsByCarrier = new Map<string, Agreement[]>();
  agreements.forEach((agreement) => {
    const list = agreementsByCarrier.get(agreement.carrierId) ?? [];
    list.push(agreement);
    agreementsByCarrier.set(agreement.carrierId, list);
  });

  // Build per-carrier projection.
  carrierIds.forEach((carrierId) => {
    const bucket = docsByCarrier.get(carrierId) ?? newBucket();
    const carrierAgreements = agreementsByCarrier.get(carrierId) ?? [];

    const insuranceLatest = pickLatestByCreatedAt(bucket.INSURANCE_CERT);
    const insuranceExpiresAt = insuranceLatest?.expiresAt ?? null;
    const insurance: InsuranceStatus =
      insuranceLatest === null
        ? { onFile: false, expiresAt: null, warning: null }
        : {
            onFile: true,
            expiresAt: insuranceExpiresAt,
            warning: deriveInsuranceWarning(insuranceExpiresAt, now),
          };

    const w9: DocumentOnFileStatus = { onFile: bucket.W9.length > 0 };
    const carrierPacket: DocumentOnFileStatus = { onFile: bucket.CARRIER_PACKET.length > 0 };

    const latestAgreement = pickLatestAgreement(carrierAgreements);
    const agreement: AgreementStatus =
      latestAgreement === null
        ? { onFile: false, signedAgreementId: null, signedAt: null }
        : {
            onFile: true,
            signedAgreementId: latestAgreement.id,
            signedAt: latestAgreement.signedAt,
          };

    result.set(carrierId, { insurance, w9, carrierPacket, agreement });
  });

  return result;
};
