import type { Request } from 'express';
import type { SaveLanePreferencesInput } from '../../types/lanePreferencesTypes';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

interface LanePreferencesServiceInput {
  carrierId: string;
  organizationId: string;
  input: SaveLanePreferencesInput;
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

export const lanePreferencesMapper = (req: Request): LanePreferencesServiceInput => {
  const { carrierId, organizationId } = getPortalContext(req);
  const body = req.body as { fleet: SaveLanePreferencesInput['fleet']; overrides?: SaveLanePreferencesInput['overrides'] };
  return {
    carrierId,
    organizationId,
    input: {
      fleet: body.fleet,
      overrides: body.overrides ?? {},
    },
  };
};
