import type { Agreement, AgreementTemplateKey } from '@prisma/client';

/**
 * Cross-module read port: the carrier portal needs to query agreements but does
 * not own that data. Implemented by `agreementsModule.queries`.
 */
export interface PortalAgreementQueryPort {
  findLatestForCarrier(
    carrierId: string,
    templateKey: AgreementTemplateKey,
  ): Promise<Agreement | null>;
}
