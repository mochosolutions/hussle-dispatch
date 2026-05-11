import type { EquipmentType, VehicleCategory } from '@prisma/client';
import { ValidationError } from '@/shared/errors';

interface VehicleInput {
  category: VehicleCategory;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  gvwr?: number;
  lenderName?: string;
  loanPayment?: number;
  loanInterestRate?: number;
  insuranceMonthlyCost?: number;
  deliveryTypes?: string[];
  insuranceAttested?: boolean;
}

export interface SaveEquipmentInput {
  carrierId: string;
  organizationId: string;
  vehicles: VehicleInput[];
  medicalCourierCompliance?: Record<string, unknown>;
}

interface CreatedVehicleSummary {
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

export interface PortalEquipmentServiceDeps {
  findCarrierById: (carrierId: string) => Promise<CarrierRecord | null>;
  deleteVehiclesByCarrierId: (carrierId: string) => Promise<void>;
  createVehicles: (
    data: {
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
      lenderName?: string;
      loanPayment?: number;
      loanInterestRate?: number;
      insuranceMonthlyCost?: number;
      deliveryTypes?: string[];
    }[],
  ) => Promise<{ id: string; category: VehicleCategory | null; make: string | null; model: string | null; year: number | null }[]>;
}

const CATEGORY_TO_EQUIPMENT_TYPE: Record<VehicleCategory, EquipmentType> = {
  SEMI_TRUCK: 'DRY_VAN',
  BOX_TRUCK: 'BOX_TRUCK',
  CARGO_VAN: 'HOTSHOT',
  PERSONAL_VEHICLE: 'HOTSHOT',
};

const mapCategoryToEquipmentType = (category: VehicleCategory): EquipmentType =>
  CATEGORY_TO_EQUIPMENT_TYPE[category];

const generateUnitNumber = (index: number): string => {
  const padded = String(index + 1).padStart(3, '0');
  return `V-${padded}`;
};

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
      case 'PERSONAL_VEHICLE': {
        if (!vehicle.deliveryTypes || vehicle.deliveryTypes.length === 0) {
          throw new ValidationError(
            'At least one delivery type is required for personal vehicles',
          );
        }
        break;
      }
      default:
        break;
    }
  });
};

export const createPortalEquipmentService = (deps: PortalEquipmentServiceDeps) => ({
  saveEquipment: async (
    input: SaveEquipmentInput,
  ): Promise<CreatedVehicleSummary[]> => {
    const carrier = await deps.findCarrierById(input.carrierId);

    if (!carrier) {
      throw new ValidationError('Carrier not found');
    }

    validateComplianceRules(input.vehicles, carrier);

    await deps.deleteVehiclesByCarrierId(input.carrierId);

    const vehicleData = input.vehicles.map((v, index) => ({
      carrierId: input.carrierId,
      unitNumber: generateUnitNumber(index),
      type: mapCategoryToEquipmentType(v.category),
      category: v.category,
      year: v.year,
      make: v.make,
      model: v.model,
      vin: v.vin,
      licensePlate: v.licensePlate,
      gvwr: v.gvwr,
      lenderName: v.lenderName,
      loanPayment: v.loanPayment,
      loanInterestRate: v.loanInterestRate,
      insuranceMonthlyCost: v.insuranceMonthlyCost,
      deliveryTypes: v.deliveryTypes,
    }));

    const created = await deps.createVehicles(vehicleData);

    return created;
  },
});

export type PortalEquipmentService = ReturnType<typeof createPortalEquipmentService>;
