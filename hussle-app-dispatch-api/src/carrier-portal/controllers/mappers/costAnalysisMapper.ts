import type { Request } from 'express';
import type { CostAnalysisInput } from '../../types/costAnalysisTypes';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

interface CostAnalysisServiceInput {
  carrierId: string;
  organizationId: string;
  input: CostAnalysisInput;
}

const getPortalContext = (req: Request): { carrierId: string; organizationId: string } => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return {
    carrierId: req.carrierPortal.carrierId,
    organizationId: req.carrierPortal.organizationId,
  };
};

export const costAnalysisMapper = (req: Request): CostAnalysisServiceInput => {
  const { carrierId, organizationId } = getPortalContext(req);
  return {
    carrierId,
    organizationId,
    input: {
      truckPayment: req.body.truckPayment,
      insuranceCost: req.body.insuranceCost,
      fuelCostPerGallon: req.body.fuelCostPerGallon,
      milesPerGallon: req.body.milesPerGallon,
      maintenanceMonthlyCost: req.body.maintenanceMonthlyCost,
      otherMonthlyCosts: req.body.otherMonthlyCosts,
    },
  };
};
