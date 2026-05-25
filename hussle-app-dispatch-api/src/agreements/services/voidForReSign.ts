import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import type { AgreementRepoPort } from '../types/agreementRepoPort';

export type IdentityField = 'legalName' | 'mcNumber' | 'dotNumber';

export interface VoidForReSignInput {
  carrierId: string;
  organizationId: string;
  changedFields: IdentityField[];
}

export interface VoidForReSignDeps {
  agreementRepo: AgreementRepoPort;
  eventBus: EventBus;
  logger: Logger;
  now?: () => Date;
}

const VOID_REASON = 'CARRIER_IDENTITY_CHANGED';

/**
 * Void every SIGNED agreement for a carrier when one of their contract-bound
 * identity fields (legalName / mcNumber / dotNumber) is about to change.
 *
 * Today's only template (DISPATCH_AGREEMENT) embeds all three identity fields,
 * so any change voids every signed agreement on the carrier. When future
 * templates land with disjoint field sets, refine this to only void agreements
 * whose template actually references one of `changedFields`.
 *
 * Side effects:
 *   - Each affected Agreement row: status → 'VOIDED', voidReason →
 *     'CARRIER_IDENTITY_CHANGED', voidedAt → now.
 *   - Carrier.dispatchAgreementSignedAt and Carrier.signedAgreementId are
 *     cleared so the downstream saveCompany call sees an "unsigned" carrier
 *     and the carrier-portal signing step surfaces the re-sign flow.
 *   - One `agreement.voided` event per affected agreement.
 */
export const voidForReSign = async (
  input: VoidForReSignInput,
  deps: VoidForReSignDeps,
): Promise<{ voidedAgreementIds: string[] }> => {
  const signed = await deps.agreementRepo.findAllSignedForCarrier(
    input.carrierId,
    input.organizationId,
  );

  if (signed.length === 0) {
    return { voidedAgreementIds: [] };
  }

  const now = (deps.now ?? (() => new Date()))();
  const voidedAgreementIds: string[] = [];

  for (const agreement of signed) {
    const updated = await deps.agreementRepo.update(agreement.id, {
      status: 'VOIDED',
      voidedAt: now,
      voidReason: VOID_REASON,
    });
    voidedAgreementIds.push(updated.id);

    await deps.eventBus.publish('agreement.voided', {
      agreementId: updated.id,
      organizationId: updated.organizationId,
      carrierId: updated.carrierId,
      voidedAt: now.toISOString(),
      voidReason: VOID_REASON,
      voidedByUserId: null,
    });
  }

  deps.logger.info('Voided agreements for carrier identity change', {
    carrierId: input.carrierId,
    organizationId: input.organizationId,
    changedFields: input.changedFields,
    voidedAgreementIds,
  });

  return { voidedAgreementIds };
};
