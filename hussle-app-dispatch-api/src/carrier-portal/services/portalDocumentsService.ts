import type {
  PortalDocument,
  PortalDocumentRepoPort,
  CarrierCompliancePort,
  PresignPort,
} from '../types/portalDocumentsTypes';
import { NotFoundError, ValidationError } from '@/shared/errors/commonErrors';

interface PortalDocumentsServiceDeps {
  documentRepo: PortalDocumentRepoPort;
  carrierCompliance: CarrierCompliancePort;
  presignPort: PresignPort;
  s3Bucket: string;
}

interface PresignInput {
  fileName: string;
  contentType: string;
  documentType: string;
}

interface PresignResult {
  documentId: string;
  uploadUrl: string;
  fields: Record<string, string>;
}

interface ConfirmInput {
  documentType: string;
  insuranceExpiry?: string;
  coverageConfirmed?: boolean;
}

interface SignInput {
  signatureData: string;
  consentGiven: boolean;
  signerName?: string;
  signerTitle?: string;
}

interface SignRequestMeta {
  ip: string;
  userAgent: string;
}

const COMPLIANCE_FLAG_MAP: Record<string, (input: ConfirmInput) => Record<string, unknown>> = {
  DISPATCH_AGREEMENT: () => ({ dispatchAgreementOnFile: true }),
  INSURANCE_CERT: (input) => ({
    insuranceCertOnFile: true,
    ...(input.insuranceExpiry ? { insuranceExpiry: input.insuranceExpiry } : {}),
  }),
  W9: () => ({}),
};

// `maxSize` passed to generatePresignedPutUrl is the client-asserted upload
// size to compare against the content-type-specific limit in s3Presign.ts:
//   application/pdf    → 5 MB
//   image/png/jpg/jpeg → 10 MB
// We don't know the actual file size at presign time (the UI doesn't send
// it), so pick the lower of the two so the upper bound is never exceeded.
const MAX_UPLOAD_SIZE_BY_CONTENT_TYPE: Record<string, number> = {
  'application/pdf': 5 * 1024 * 1024,
  'image/png': 10 * 1024 * 1024,
  'image/jpg': 10 * 1024 * 1024,
  'image/jpeg': 10 * 1024 * 1024,
};

export const createPortalDocumentsService = (deps: PortalDocumentsServiceDeps) => ({
  listDocuments: async (
    carrierId: string,
    organizationId: string,
  ): Promise<PortalDocument[]> => deps.documentRepo.listByCarrier(carrierId, organizationId),

  presignDocument: async (
    carrierId: string,
    organizationId: string,
    input: PresignInput,
  ): Promise<PresignResult> => {
    const s3Key = deps.presignPort.buildCarrierDocumentKey({
      orgId: organizationId,
      carrierId,
      type: input.documentType,
      filename: input.fileName,
    });

    const maxSize = MAX_UPLOAD_SIZE_BY_CONTENT_TYPE[input.contentType] ?? 5 * 1024 * 1024;
    const { url } = await deps.presignPort.generatePresignedPutUrl({
      bucket: deps.s3Bucket,
      key: s3Key,
      contentType: input.contentType,
      maxSize,
    });

    const doc = await deps.documentRepo.create({
      organizationId,
      entityType: 'carrier',
      entityId: carrierId,
      type: input.documentType,
      fileName: input.fileName,
      s3Key,
      url,
      uploadStatus: 'pending',
    });

    return {
      documentId: doc.id,
      uploadUrl: url,
      fields: {},
    };
  },

  confirmDocument: async (
    documentId: string,
    carrierId: string,
    organizationId: string,
    input: ConfirmInput,
  ): Promise<PortalDocument> => {
    const doc = await deps.documentRepo.findByIdAndCarrier(documentId, carrierId, organizationId);
    if (!doc) {
      throw new NotFoundError(`Document with id ${documentId} not found`);
    }

    const updated = await deps.documentRepo.updateStatus(documentId, {
      uploadStatus: 'confirmed',
      reviewStatus: 'pending_review',
    });

    const flagBuilder = COMPLIANCE_FLAG_MAP[input.documentType];
    if (flagBuilder) {
      await deps.carrierCompliance.updateComplianceFlags(carrierId, flagBuilder(input));
    }

    return updated;
  },

  signDocument: async (
    documentId: string,
    carrierId: string,
    organizationId: string,
    input: SignInput,
    requestMeta: SignRequestMeta,
  ): Promise<PortalDocument> => {
    if (!input.consentGiven) {
      throw new ValidationError('Consent is required to sign this document');
    }

    const doc = await deps.documentRepo.findByIdAndCarrier(documentId, carrierId, organizationId);
    if (!doc) {
      throw new NotFoundError(`Document with id ${documentId} not found`);
    }

    const now = new Date();

    const updated = await deps.documentRepo.updateSignature(documentId, {
      signatureData: input.signatureData,
      signedAt: now,
      uploadStatus: 'signed',
      reviewStatus: 'pending_review',
    });

    await deps.carrierCompliance.updateComplianceFlags(carrierId, {
      dispatchAgreementConsentIp: requestMeta.ip,
      dispatchAgreementConsentUserAgent: requestMeta.userAgent,
      dispatchAgreementSignedAt: now,
      dispatchAgreementOnFile: true,
    });

    return updated;
  },
});
