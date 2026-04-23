import type { PortalDriverRepoPort } from '../repositories/portalDriverRepoPrisma';
import { DriverStatus } from '@prisma/client';

interface DriverEntry {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  payType?: string;
  payRate?: number;
}

interface SaveDriversInput {
  carrierId: string;
  hasAdditionalDrivers: boolean;
  drivers?: DriverEntry[];
}

interface SavedDriver {
  id: string;
  firstName: string;
  lastName: string;
}

interface PortalDriversServiceDeps {
  driverRepo: PortalDriverRepoPort;
}

export interface PortalDriversService {
  saveDrivers: (input: SaveDriversInput) => Promise<SavedDriver[]>;
}

const buildPayNotes = (payType?: string, payRate?: number): string | null => {
  if (!payType && payRate === undefined) {
    return null;
  }

  const payInfo: Record<string, unknown> = {};

  if (payType) {
    payInfo.payType = payType;
  }

  if (payRate !== undefined) {
    payInfo.payRate = payRate;
  }

  return JSON.stringify(payInfo);
};

export const createPortalDriversService = (
  deps: PortalDriversServiceDeps,
): PortalDriversService => ({
  saveDrivers: async (input) => {
    const { carrierId, hasAdditionalDrivers, drivers } = input;

    if (!hasAdditionalDrivers) {
      await deps.driverRepo.deleteByCarrierId(carrierId);
      return [];
    }

    if (!drivers || drivers.length === 0) {
      return [];
    }

    await deps.driverRepo.deleteByCarrierId(carrierId);

    const created: SavedDriver[] = [];

    for (const entry of drivers) {
      const driver = await deps.driverRepo.create({
        carrierId,
        firstName: entry.firstName,
        lastName: entry.lastName,
        phone: entry.phone ?? null,
        email: entry.email ?? null,
        status: DriverStatus.ACTIVE,
        notes: buildPayNotes(entry.payType, entry.payRate),
      });

      created.push(driver);
    }

    return created;
  },
});
