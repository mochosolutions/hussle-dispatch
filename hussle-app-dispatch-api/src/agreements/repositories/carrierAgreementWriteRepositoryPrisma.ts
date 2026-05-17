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

    await prisma.carrier.update({
      where: { id: carrierId },
      data: {
        signedAgreementId: agreementId,
        dispatchAgreementSignedAt: new Date(),
      },
    });
  },
});
