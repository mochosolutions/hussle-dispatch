import type { PrismaClient, Prisma } from '@prisma/client';
import { VehicleOwnership } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { NotFoundError } from '@/shared/errors/commonErrors';
import type { CostAnalysisWritePort, EquipmentPaymentInput } from '../types/costAnalysisTypes';

const toPrismaOwnership = (input: EquipmentPaymentInput['ownership']): VehicleOwnership =>
  input === 'owned' ? VehicleOwnership.OWNED : VehicleOwnership.LEASED;

// Accepts either a PrismaClient (production wiring) or a PrismaTransaction (nested under an
// outer tx). The $transaction call requires a full client; if a tx was passed, we run the
// operations inline because we are already inside someone else's transaction.
export const portalCostAnalysisWriteAdapter = (
  prisma: PrismaClient | PrismaTransaction,
): CostAnalysisWritePort => ({
  saveTransactional: async (carrierId, organizationId, args) => {
    const runWithinTx = async (tx: PrismaTransaction | Prisma.TransactionClient): Promise<void> => {
      // Ownership check inside the tx so we fail fast if the carrier is gone.
      const carrier = await tx.carrier.findFirst({
        where: { id: carrierId, managedByOrgId: organizationId },
        select: { id: true },
      });
      if (!carrier) {
        throw new NotFoundError(`Carrier with id ${carrierId} not found`);
      }

      // Per-vehicle facts → Vehicle columns. Vehicle ownership is enforced via the
      // carrierId scope on the update — a vehicle from a different carrier is silently
      // not matched (updateMany affects 0 rows; we promote that to NotFoundError).
      for (const payment of args.equipmentPayments) {
        const result = await tx.vehicle.updateMany({
          where: { id: payment.assetId, carrierId },
          data: {
            ownership: toPrismaOwnership(payment.ownership),
            loanPayment: payment.monthlyAmount,
            insuranceMonthlyCost: payment.insuranceMonthlyAmount ?? null,
          },
        });
        if (result.count === 0) {
          throw new NotFoundError(`Vehicle ${payment.assetId} not found for carrier ${carrierId}`);
        }
      }

      // OnboardingSession.answers merge — read current value, merge under costAnalysis key,
      // write back. The session row is unique on carrierId.
      const session = await tx.onboardingSession.findUnique({ where: { carrierId } });
      if (!session) {
        throw new NotFoundError(`Onboarding session for carrier ${carrierId} not found`);
      }
      const currentAnswers = (session.answers ?? {}) as Record<string, Prisma.InputJsonValue>;
      const mergedAnswers: Record<string, Prisma.InputJsonValue> = {
        ...currentAnswers,
        ...(args.answersPatch as Record<string, Prisma.InputJsonValue>),
      };
      await tx.onboardingSession.update({
        where: { carrierId },
        data: {
          answers: mergedAnswers,
          lastActiveAt: new Date(),
        },
      });

      // Carrier output: minimumRatePerMile + costProfileVersion bump.
      await tx.carrier.update({
        where: { id: carrierId },
        data: {
          minimumRatePerMile: args.minimumRatePerMile,
          costProfileVersion: args.nextCostProfileVersion,
          costProfileSource: args.costProfileSource,
        },
      });
    };

    if ('$transaction' in prisma) {
      await prisma.$transaction((tx) => runWithinTx(tx));
      return;
    }
    await runWithinTx(prisma);
  },
});
