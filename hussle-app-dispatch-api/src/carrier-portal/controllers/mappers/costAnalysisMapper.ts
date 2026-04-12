import type { Request } from 'express';
import type { CostAnalysisInput } from '../../types/costAnalysisTypes';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

interface CostAnalysisServiceInput {
  carrierId: string;
  input: CostAnalysisInput;
}

const getCarrierId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.carrierId;
};

export const costAnalysisMapper = (req: Request): CostAnalysisServiceInput => ({
  carrierId: getCarrierId(req),
  input: {
    truckPayment: req.body.truckPayment,
    insuranceCost: req.body.insuranceCost,
    fuelCostPerGallon: req.body.fuelCostPerGallon,
    milesPerGallon: req.body.milesPerGallon,
    maintenanceMonthlyCost: req.body.maintenanceMonthlyCost,
    otherMonthlyCosts: req.body.otherMonthlyCosts,
  },
});
