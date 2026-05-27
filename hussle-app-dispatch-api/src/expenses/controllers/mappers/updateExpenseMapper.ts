import type { Request } from 'express';
import type { UpdateExpenseInput } from '../../types/expenseTypes';

export const updateExpenseMapper = (req: Request): UpdateExpenseInput => ({
  id: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
  vehicleId: req.body.vehicleId,
  driverId: req.body.driverId,
  category: req.body.category,
  vendor: req.body.vendor,
  amount: req.body.amount,
  date: req.body.date,
  state: req.body.state,
  notes: req.body.notes,
  gallons: req.body.gallons,
  pricePerGallon: req.body.pricePerGallon,
  fuelType: req.body.fuelType,
  odometer: req.body.odometer,
});
