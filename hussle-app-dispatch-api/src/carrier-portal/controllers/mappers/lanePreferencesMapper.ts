import type { Request } from 'express';
import type { SaveLanePreferencesInput } from '../../types/lanePreferencesTypes';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

interface LanePreferencesServiceInput {
  carrierId: string;
  input: SaveLanePreferencesInput;
}

const getCarrierId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.carrierId;
};

export const lanePreferencesMapper = (req: Request): LanePreferencesServiceInput => ({
  carrierId: getCarrierId(req),
  input: {
    homeBaseCity: req.body.homeBaseCity,
    homeBaseState: req.body.homeBaseState,
    maxDaysOut: req.body.maxDaysOut,
    preferredLanes: req.body.preferredLanes,
    statePreferences: req.body.statePreferences,
    freightPreferences: req.body.freightPreferences,
  },
});
