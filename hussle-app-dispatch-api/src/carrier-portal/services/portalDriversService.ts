import type { PortalDriverRepoPort } from '../repositories/portalDriverRepoPrisma';
import { DriverStatus, DriverPayType } from '@prisma/client';

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

const toDriverPayType = (value?: string): DriverPayType => {
  if (value === 'PER_MILE') return DriverPayType.PER_MILE;
  if (value === 'PER_HOUR') return DriverPayType.PER_HOUR;
  if (value === 'FLAT_RATE') return DriverPayType.FLAT_RATE;
  return DriverPayType.PERCENTAGE;
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
        notes: null,
        payType: toDriverPayType(entry.payType),
        payRate: entry.payRate ?? 0,
      });

      created.push(driver);
    }

    return created;
  },
});
