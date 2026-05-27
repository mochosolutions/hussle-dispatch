import type { Request } from 'express';
import type { IftaReportInput } from '../../types/iftaTypes';

export const iftaReportMapper = (req: Request): IftaReportInput => ({
  organizationId: req.organizationId ?? '',
  year: Number(req.query['year']),
  quarter: Number(req.query['quarter']),
  vehicleId: req.query['vehicleId'] as string | undefined,
});
