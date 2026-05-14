// Signature domain types and service contract.

// AgreementTemplateKey lives in @prisma/client post US-04. For now, alias as a literal union.
// US-08 will swap to importing from @prisma/client once the migration runs.
export type AgreementTemplateKey = 'DISPATCH_AGREEMENT';

export interface CreateSubmissionInput {
  templateKey: AgreementTemplateKey;
  variables: Record<string, string>;
  signer: { name: string; email: string };
  metadata?: Record<string, string>;
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

export type SubmissionStatus =
  | { status: 'pending'; providerSubmissionId: string }
  | { status: 'signed'; providerSubmissionId: string; signedAt: Date }
  | { status: 'declined'; providerSubmissionId: string; declinedAt: Date }
  | { status: 'voided'; providerSubmissionId: string; voidedAt: Date }
  | { status: 'expired'; providerSubmissionId: string; expiredAt: Date };

export interface SignatureServiceOpts {
  correlationId?: string;
}

export interface SignatureService {
  createSubmission(
    input: CreateSubmissionInput,
    opts?: SignatureServiceOpts
  ): Promise<SubmissionRef>;
  getSubmission(providerSubmissionId: string): Promise<SubmissionStatus>;
  voidSubmission(providerSubmissionId: string): Promise<void>;
  fetchSignedArtifacts(providerSubmissionId: string): Promise<SignedArtifacts>;
}
