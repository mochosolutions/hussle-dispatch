import type { PortalDocument } from '../../types/portalDocumentsTypes';

interface PortalDocumentResponse {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  reviewStatus: string | null;
  signatureData: string | null;
  signedAt: string | null;
  createdAt: string;
}

export const portalDocumentTransformer = (doc: PortalDocument): PortalDocumentResponse => ({
  id: doc.id,
  documentType: doc.documentType,
  fileName: doc.fileName,
  fileUrl: doc.fileUrl,
  reviewStatus: doc.reviewStatus,
  signatureData: doc.signatureData ?? null,
  signedAt: doc.signedAt ? doc.signedAt.toISOString() : null,
  createdAt: doc.createdAt.toISOString(),
});

export const portalDocumentListTransformer = (
  docs: PortalDocument[],
): PortalDocumentResponse[] => docs.map(portalDocumentTransformer);

interface PresignDocumentResponse {
  documentId: string;
  uploadUrl: string;
  fields: Record<string, string>;
}

export const presignDocumentTransformer = (result: {
  documentId: string;
  uploadUrl: string;
  fields: Record<string, string>;
}): PresignDocumentResponse => ({
  documentId: result.documentId,
  uploadUrl: result.uploadUrl,
  fields: result.fields,
});
