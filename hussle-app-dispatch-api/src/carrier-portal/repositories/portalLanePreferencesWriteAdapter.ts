import type { PrismaClient, Prisma } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { NotFoundError } from '@/shared/errors/commonErrors';
import type {
  FleetLanePreferences,
  LanePreferencesWritePort,
  SaveLanePreferencesInput,
} from '../types/lanePreferencesTypes';

const toJsonValue = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));

const fleetWriteData = (fleet: FleetLanePreferences): Prisma.CarrierUpdateInput => ({
  preferredLanes: toJsonValue(fleet.lanes),
  weeklySchedule: toJsonValue({
    schedule: fleet.schedule,
    preset: fleet.schedulePreset,
    maxMilesFromHome: fleet.maxMilesFromHome ?? null,
  }),
  freightPreferences: toJsonValue(fleet.freightTypes),
  homeBaseCity: fleet.homeBaseCity ?? null,
  homeBaseState: fleet.homeBaseState ?? null,
  maxDaysOut: fleet.maxDaysOut ?? null,
});

const driverOverrideWriteData = (
  override: Partial<FleetLanePreferences>,
): Prisma.DriverUpdateInput => {
  const data: Prisma.DriverUpdateInput = {};
  if (override.lanes !== undefined) {
    data.preferredLanes = toJsonValue(override.lanes);
  }
  if (override.schedule !== undefined || override.schedulePreset !== undefined || override.maxMilesFromHome !== undefined) {
    data.weeklySchedule = toJsonValue({
      schedule: override.schedule ?? null,
      preset: override.schedulePreset ?? null,
      maxMilesFromHome: override.maxMilesFromHome ?? null,
    });
  }
  if (override.freightTypes !== undefined) {
    data.freightPreferences = toJsonValue(override.freightTypes);
  }
  if (override.homeBaseCity !== undefined) {
    data.homeBaseCity = override.homeBaseCity ?? null;
  }
  if (override.homeBaseState !== undefined) {
    data.homeBaseState = override.homeBaseState ?? null;
  }
  if (override.maxDaysOut !== undefined) {
    data.maxDaysOut = override.maxDaysOut ?? null;
  }
  return data;
};

export const portalLanePreferencesWriteAdapter = (
  prisma: PrismaClient | PrismaTransaction,
): LanePreferencesWritePort => ({
  saveTransactional: async (carrierId, organizationId, input) => {
    const runWithinTx = async (
      tx: PrismaTransaction | Prisma.TransactionClient,
    ): Promise<void> => {
      const carrier = await tx.carrier.findFirst({
        where: { id: carrierId, managedByOrgId: organizationId },
        select: { id: true },
      });
      if (!carrier) {
        throw new NotFoundError(`Carrier with id ${carrierId} not found`);
      }

      // Fleet defaults → Carrier columns.
      await tx.carrier.update({
        where: { id: carrierId },
        data: fleetWriteData(input.fleet),
      });

      // Per-driver overrides → Driver columns. Verify each driver belongs to the carrier
      // via the carrierId scope in the updateMany filter (silently skips unknown drivers).
      for (const [driverId, override] of Object.entries(input.overrides)) {
        if (!override || Object.keys(override).length === 0) continue;
        const data = driverOverrideWriteData(override);
        if (Object.keys(data).length === 0) continue;
        const result = await tx.driver.updateMany({
          where: { id: driverId, carrierId, deletedAt: null },
          data,
        });
        if (result.count === 0) {
          throw new NotFoundError(`Driver ${driverId} not found for carrier ${carrierId}`);
        }
      }

      // Mirror everything in answers.lanePreferences.
      const session = await tx.onboardingSession.findUnique({ where: { carrierId } });
      if (!session) {
        throw new NotFoundError(`Onboarding session for carrier ${carrierId} not found`);
      }
      const currentAnswers = (session.answers ?? {}) as Record<string, Prisma.InputJsonValue>;
      const mergedAnswers: Record<string, Prisma.InputJsonValue> = {
        ...currentAnswers,
        lanePreferences: toJsonValue(input),
      };
      await tx.onboardingSession.update({
        where: { carrierId },
        data: { answers: mergedAnswers, lastActiveAt: new Date() },
      });
    };

    if ('$transaction' in prisma) {
      await prisma.$transaction((tx) => runWithinTx(tx));
      return;
    }
    await runWithinTx(prisma);
  },
});
