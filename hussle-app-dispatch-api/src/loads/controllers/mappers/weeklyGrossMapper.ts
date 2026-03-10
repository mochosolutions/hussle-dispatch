import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import type { GetWeeklyGrossInput } from '../../types/weeklyGrossTypes';

export const weeklyGrossMapper = (req: Request): GetWeeklyGrossInput => {
  const organizationId = req.organizationId;
  const role = req.user?.role;

  if (organizationId === undefined || role === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return { organizationId, role };
};
