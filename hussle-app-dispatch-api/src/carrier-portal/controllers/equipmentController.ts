import type { Request, Response, RequestHandler } from 'express';
import type { VehicleCategory } from '@prisma/client';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors';
import type { PortalEquipmentService, SaveEquipmentInput } from '../services/portalEquipmentService';

interface EquipmentControllerDeps {
  equipmentService: PortalEquipmentService;
}

export interface EquipmentControllers {
  saveEquipment: RequestHandler;
}

interface VehicleRequestBody {
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

interface SaveEquipmentRequestBody {
  vehicles: VehicleRequestBody[];
  medicalCourierCompliance?: Record<string, unknown>;
}

const mapRequestToInput = (req: Request): SaveEquipmentInput => {
  const portalContext = req.carrierPortal;

  if (!portalContext) {
    throw new UnauthorizedError('Carrier portal context is required');
  }

  const body: SaveEquipmentRequestBody = req.body;

  return {
    carrierId: portalContext.carrierId,
    organizationId: portalContext.organizationId,
    vehicles: body.vehicles.map((v) => ({
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
      insuranceAttested: v.insuranceAttested,
    })),
    medicalCourierCompliance: body.medicalCourierCompliance,
  };
};

export const createEquipmentControllers = (
  deps: EquipmentControllerDeps,
): EquipmentControllers => ({
  saveEquipment: async (req: Request, res: Response): Promise<void> => {
    const input = mapRequestToInput(req);
    const vehicles = await deps.equipmentService.saveEquipment(input);
    sendSingle(res, vehicles, 200);
  },
});
