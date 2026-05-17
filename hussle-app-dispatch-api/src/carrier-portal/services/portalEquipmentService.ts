import type { EquipmentType, VehicleCategory } from '@prisma/client';
import { ValidationError } from '@/shared/errors';

interface VehicleInput {
  id?: string;
  category: VehicleCategory;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  gvwr?: number;
}

export interface SaveEquipmentInput {
  carrierId: string;
  organizationId: string;
  vehicles: VehicleInput[];
}

interface VehicleSummary {
  id: string;
  category: VehicleCategory | null;
  make: string | null;
  model: string | null;
  year: number | null;
}

interface CarrierRecord {
  id: string;
  mcNumber: string | null;
  dotNumber: string | null;
}

interface UpsertVehicleData {
  id?: string;
  carrierId: string;
  unitNumber: string;
  type: EquipmentType;
  category: VehicleCategory;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  gvwr?: number;
}

export interface PortalEquipmentServiceDeps {
  findCarrierById: (carrierId: string) => Promise<CarrierRecord | null>;
  findVehiclesByCarrierId: (
    carrierId: string,
  ) => Promise<{ id: string; unitNumber: string }[]>;
  upsertVehicles: (
    carrierId: string,
    data: UpsertVehicleData[],
    deleteIds: string[],
  ) => Promise<VehicleSummary[]>;
}

const CATEGORY_TO_EQUIPMENT_TYPE: Record<VehicleCategory, EquipmentType> = {
  SEMI_TRUCK: 'DRY_VAN',
  BOX_TRUCK: 'BOX_TRUCK',
  CARGO_VAN: 'HOTSHOT',
  PERSONAL_VEHICLE: 'HOTSHOT',
};

const mapCategoryToEquipmentType = (category: VehicleCategory): EquipmentType =>
  CATEGORY_TO_EQUIPMENT_TYPE[category];

const validateComplianceRules = (
  vehicles: VehicleInput[],
  carrier: CarrierRecord,
): void => {
  vehicles.forEach((vehicle) => {
    switch (vehicle.category) {
      case 'SEMI_TRUCK': {
        if (!carrier.mcNumber) {
          throw new ValidationError('MC number is required for semi trucks');
        }
        break;
      }
      case 'BOX_TRUCK': {
        if (vehicle.gvwr !== undefined && vehicle.gvwr > 26000 && !carrier.dotNumber) {
          throw new ValidationError(
            'DOT number is required for vehicles over 26,000 lbs GVWR',
          );
        }
        break;
      }
      default:
        break;
    }
  });
};

const generateUnitNumber = (index: number): string => {
  const padded = String(index + 1).padStart(3, '0');
  return `V-${padded}`;
};

// Pick the next available unitNumber that doesn't collide with one held by an edited row.
// Existing rows keep their unitNumber so downstream references survive re-saves.
const computeNewUnitNumber = (
  reserved: Set<string>,
  startIndex: number,
): { unitNumber: string; nextIndex: number } => {
  let i = startIndex;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = generateUnitNumber(i);
    if (!reserved.has(candidate)) {
      reserved.add(candidate);
      return { unitNumber: candidate, nextIndex: i + 1 };
    }
    i += 1;
  }
};

export const createPortalEquipmentService = (deps: PortalEquipmentServiceDeps) => ({
  saveEquipment: async (
    input: SaveEquipmentInput,
  ): Promise<VehicleSummary[]> => {
    const carrier = await deps.findCarrierById(input.carrierId);

    if (!carrier) {
      throw new ValidationError('Carrier not found');
    }

    validateComplianceRules(input.vehicles, carrier);

    const existing = await deps.findVehiclesByCarrierId(input.carrierId);
    const existingById = new Map(existing.map((v) => [v.id, v.unitNumber]));
    const incomingIds = new Set(
      input.vehicles.map((v) => v.id).filter((id): id is string => Boolean(id)),
    );

    // Rows to delete: existing ids missing from the incoming list.
    const deleteIds = existing.map((v) => v.id).filter((id) => !incomingIds.has(id));

    // Track unitNumbers held by edited rows so new rows don't collide.
    const reservedUnitNumbers = new Set<string>(
      input.vehicles
        .map((v) => (v.id ? existingById.get(v.id) : undefined))
        .filter((u): u is string => Boolean(u)),
    );

    let newRowIndex = 0;
    const upsertData: UpsertVehicleData[] = input.vehicles.map((v) => {
      const existingUnitNumber = v.id ? existingById.get(v.id) : undefined;
      let unitNumber: string;
      if (existingUnitNumber) {
        unitNumber = existingUnitNumber;
      } else {
        const allocated = computeNewUnitNumber(reservedUnitNumbers, newRowIndex);
        unitNumber = allocated.unitNumber;
        newRowIndex = allocated.nextIndex;
      }
      return {
        id: v.id,
        carrierId: input.carrierId,
        unitNumber,
        type: mapCategoryToEquipmentType(v.category),
        category: v.category,
        year: v.year,
        make: v.make,
        model: v.model,
        vin: v.vin,
        licensePlate: v.licensePlate,
        gvwr: v.gvwr,
      };
    });

    return deps.upsertVehicles(input.carrierId, upsertData, deleteIds);
  },
});

export type PortalEquipmentService = ReturnType<typeof createPortalEquipmentService>;
