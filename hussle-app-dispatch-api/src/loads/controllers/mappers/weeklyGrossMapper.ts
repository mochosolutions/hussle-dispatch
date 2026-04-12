import type { Request } from 'express';
import type { GetWeeklyGrossInput } from '../../types/weeklyGrossTypes';

export const weeklyGrossMapper = (req: Request): GetWeeklyGrossInput => ({
  organizationId: req.organizationId ?? '',
  role: req.user?.role ?? '',
});
