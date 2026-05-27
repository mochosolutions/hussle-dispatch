import type { Request } from 'express';
import type { GetVehicleWeeklyRevenueInput } from '../../types/weeklyGrossTypes';

const DEFAULT_WEEKS = 8;

export const vehicleWeeklyRevenueMapper = (req: Request): GetVehicleWeeklyRevenueInput => {
  const rawWeeks = req.query['weeks'];
  const parsed =
    typeof rawWeeks === 'string' && rawWeeks.length > 0 ? Number.parseInt(rawWeeks, 10) : NaN;

  return {
    organizationId: req.organizationId ?? '',
    role: req.user?.role ?? '',
    vehicleId: req.params['vehicleId'] ?? '',
    weeks: Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WEEKS,
  };
};
