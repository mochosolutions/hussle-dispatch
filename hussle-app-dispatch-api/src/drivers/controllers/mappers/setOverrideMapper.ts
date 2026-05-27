import type { Request } from 'express';
import type { ScheduleOverrideInput } from '../../types/driverAvailabilityTypes';

export const setOverrideMapper = (req: Request): ScheduleOverrideInput => ({
  driverId: req.params['driverId'] ?? '',
  organizationId: req.organizationId ?? '',
  date: req.body.date,
  type: req.body.type,
  startTime: req.body.startTime ?? null,
  endTime: req.body.endTime ?? null,
  reason: req.body.reason ?? null,
});
