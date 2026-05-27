export interface PortalDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  reviewStatus: string | null;
  signatureData: string | null;
  signedAt: Date | null;
  createdAt: Date;
}

export interface PortalDocumentRepoPort {
  listByCarrier(carrierId: string, organizationId: string): Promise<PortalDocument[]>;
  create(data: {
    organizationId: string;
    entityType: string;
    entityId: string;
    type: string;
    fileName: string;
    s3Key: string;
    url: string;
    uploadStatus: string;
  }): Promise<PortalDocument>;
  findById(id: string): Promise<PortalDocument | null>;
  findByIdAndCarrier(
    id: string,
    carrierId: string,
    organizationId: string,
  ): Promise<PortalDocument | null>;
  updateStatus(
    id: string,
    data: { uploadStatus: string; reviewStatus?: string },
  ): Promise<PortalDocument>;
}

export interface CarrierCompliancePort {
  updateComplianceFlags(carrierId: string, flags: Record<string, unknown>): Promise<void>;
}

export interface PresignPort {
  generatePresignedPutUrl(input: {
    bucket: string;
    key: string;
    contentType: string;
    maxSize: number;
  }): Promise<{ url: string; key: string; expiresAt: Date }>;
  buildCarrierDocumentKey(input: {
    orgId: string;
    carrierId: string;
    type: string;
    filename: string;
  }): string;
}
