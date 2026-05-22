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
}
