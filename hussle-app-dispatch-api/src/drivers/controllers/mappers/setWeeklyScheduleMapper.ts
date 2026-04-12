import type { Request } from 'express';
import type { SetWeeklyScheduleInput } from '../../types/driverAvailabilityTypes';

export const setWeeklyScheduleMapper = (req: Request): SetWeeklyScheduleInput => ({
  driverId: req.params['driverId'] ?? '',
  organizationId: req.organizationId ?? '',
  entries: req.body.entries,
});
