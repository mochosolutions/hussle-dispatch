import type { Agreement, AgreementTemplateKey } from '@prisma/client';

/**
 * Cross-module read/write port: the carrier portal needs to query agreements
 * AND lazily ensure one exists (safety net for when the dispatcher hasn't
 * pre-generated). Implemented by `agreementsModule.queries`.
 */
export interface PortalAgreementQueryPort {
  findLatestForCarrier(
    carrierId: string,
    templateKey: AgreementTemplateKey,
  ): Promise<Agreement | null>;
  ensureForCarrier(input: {
    carrierId: string;
    organizationId: string;
    templateKey: AgreementTemplateKey;
    signerName?: string;
    signerEmail?: string;
  }): Promise<{ data: Agreement }>;
  /**
   * Void every signed agreement for the carrier — used by the mid-signing
   * edit guard when an identity field (legalName / mcNumber / dotNumber) is
   * about to change. Clears the Carrier.dispatchAgreementSignedAt projection
   * so the subsequent saveCompany call sees an unsigned carrier.
   */
  voidForReSign(input: {
    carrierId: string;
    organizationId: string;
    changedFields: ('legalName' | 'mcNumber' | 'dotNumber')[];
  }): Promise<{ voidedAgreementIds: string[] }>;
  /**
   * Dev-only. Present when SIGNATURE_PROVIDER === 'mock'; undefined otherwise.
   * The carrier portal mounts the mock-sign route only when defined.
   */
  mockSignAgreement?: (input: {
    agreementId: string;
    carrierId: string;
  }) => Promise<{ data: Agreement }>;
}
