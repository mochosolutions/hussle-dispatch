import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

import type { CarrierAgreementWritePort } from '../types/carrierAgreementWritePort';

/**
 * Prisma implementation of the carrier-agreement projection write.
 *
 * Idempotency:
 *  - Reads the current carrier row.
 *  - Skips entirely if `signedAgreementId` and `dispatchAgreementSignedAt` are
 *    both already populated.
 *  - Otherwise writes both fields in a single update.
 */
export const carrierAgreementWriteRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CarrierAgreementWritePort => ({
  setSignedAgreementId: async (carrierId: string, agreementId: string): Promise<void> => {
    const carrier = await prisma.carrier.findUnique({
      where: { id: carrierId },
      select: { signedAgreementId: true, dispatchAgreementSignedAt: true },
    });

    if (carrier === null) {
      // Carrier was deleted between signing and projection. Nothing to do.
      return;
    }

    if (carrier.signedAgreementId !== null && carrier.dispatchAgreementSignedAt !== null) {
      // Already projected — idempotency guard.
      return;
    }

    // `dispatchAgreementOnFile` is the legacy boolean read by
    // `checkCarrierOnboarding` and the loads service. Keep it in lockstep
    // with the modern timestamps so the two signals never diverge.
    await prisma.carrier.update({
      where: { id: carrierId },
      data: {
        signedAgreementId: agreementId,
        dispatchAgreementSignedAt: new Date(),
        dispatchAgreementOnFile: true,
      },
    });
  },

  clearSignedAgreement: async (carrierId: string): Promise<void> => {
    // If the carrier was already PENDING_APPROVAL (they completed onboarding
    // before the void), revert them to ONBOARDING so the wizard is editable
    // and they re-enter the review-and-approve queue after re-signing. Other
    // statuses are left untouched — voiding doesn't unilaterally re-open a
    // SUSPENDED or ACTION_REQUIRED carrier.
    const carrier = await prisma.carrier.findUnique({
      where: { id: carrierId },
      select: { status: true },
    });

    await prisma.carrier.update({
      where: { id: carrierId },
      data: {
        signedAgreementId: null,
        dispatchAgreementSignedAt: null,
        dispatchAgreementOnFile: false,
        ...(carrier?.status === 'PENDING_APPROVAL' ? { status: 'ONBOARDING' } : {}),
      },
    });
  },
});
