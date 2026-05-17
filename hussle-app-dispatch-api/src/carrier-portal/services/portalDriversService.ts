import type { PortalDriverRepoPort } from '../repositories/portalDriverRepoPrisma';
import { DriverStatus, DriverPayType } from '@prisma/client';

interface DriverEntry {
  id?: string;
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

    // "No employee drivers" branch: soft-delete everything, return empty list.
    if (!hasAdditionalDrivers) {
      await deps.driverRepo.deleteByCarrierId(carrierId);
      return [];
    }

    const incoming = drivers ?? [];
    const existing = await deps.driverRepo.findByCarrierId(carrierId);

    const incomingIds = new Set(
      incoming.map((d) => d.id).filter((id): id is string => Boolean(id)),
    );
    const deleteIds = existing.map((d) => d.id).filter((id) => !incomingIds.has(id));

    if (incoming.length === 0) {
      // No drivers in payload but hasAdditionalDrivers=true — treat as wipe.
      await deps.driverRepo.deleteByCarrierId(carrierId);
      return [];
    }

    const upsertData = incoming.map((entry) => ({
      id: entry.id,
      carrierId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      phone: entry.phone ?? null,
      email: entry.email ?? null,
      status: DriverStatus.ACTIVE,
      notes: null,
      payType: toDriverPayType(entry.payType),
      payRate: entry.payRate ?? 0,
    }));

    return deps.driverRepo.upsertMany(carrierId, upsertData, deleteIds);
  },
});
