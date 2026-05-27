import type { Request } from 'express';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredDriverIdMapper } from './getRequiredDriverIdMapper';

export interface DeadheadToInput {
  driverId: string;
  organizationId: string;
  role: string;
  targetLat: number;
  targetLng: number;
}

export const deadheadToMapper = (req: Request): DeadheadToInput => {
  const { organizationId, role } = getRequestContextMapper(req);
  const driverId = getRequiredDriverIdMapper(req);

  return {
    driverId,
    organizationId,
    role,
    targetLat: Number(req.query['lat']),
    targetLng: Number(req.query['lng']),
  };
};
