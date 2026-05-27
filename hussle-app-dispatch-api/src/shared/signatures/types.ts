// Signature domain types and service contract.

export type AgreementTemplateKey = 'DISPATCH_AGREEMENT';

export interface CreateSubmissionInput {
  templateKey: 'DISPATCH_AGREEMENT';
  variables: Record<string, unknown>;
  signer: {
    name: string;
    email: string;
  };
  metadata?: Record<string, unknown>;
}

export interface SubmissionRef {
  providerSubmissionId: string;
  embedUrl: string;
  expiresAt: Date;
}

export interface SignedArtifacts {
  signedPdf: Buffer;
  auditCertificate: Buffer;
}

export interface SubmissionStatusPending {
  status: 'pending';
  providerSubmissionId: string;
}

export interface SubmissionStatusSigned {
  status: 'signed';
  providerSubmissionId: string;
  signedAt: Date;
}

export interface SubmissionStatusDeclined {
  status: 'declined';
  providerSubmissionId: string;
  declinedAt: Date;
}

export interface SubmissionStatusVoided {
  status: 'voided';
  providerSubmissionId: string;
  voidedAt: Date;
}

export interface SubmissionStatusExpired {
  status: 'expired';
  providerSubmissionId: string;
  expiredAt: Date;
}

export type SubmissionStatus =
  | SubmissionStatusPending
  | SubmissionStatusSigned
  | SubmissionStatusDeclined
  | SubmissionStatusVoided
  | SubmissionStatusExpired;

export interface SignatureServiceOpts {
  correlationId?: string;
}

export interface SignatureService {
  createSubmission(
    input: CreateSubmissionInput,
    opts?: SignatureServiceOpts
  ): Promise<SubmissionRef>;

  getSubmission(
    providerSubmissionId: string,
    opts?: SignatureServiceOpts
  ): Promise<SubmissionStatus>;

  voidSubmission(
    providerSubmissionId: string,
    opts?: SignatureServiceOpts
  ): Promise<void>;

  fetchSignedArtifacts(
    providerSubmissionId: string,
    opts?: SignatureServiceOpts
  ): Promise<SignedArtifacts>;

  refreshEmbedUrl(
    providerSubmissionId: string,
    opts?: SignatureServiceOpts
  ): Promise<SubmissionRef>;
}
