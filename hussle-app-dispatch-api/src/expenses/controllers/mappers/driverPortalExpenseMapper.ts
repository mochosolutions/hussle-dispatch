import type { Request } from 'express';
import type { SortOrder } from '@/shared/pagination';
import type { ExpenseCategory } from '@prisma/client';
import type { CreateExpenseInput, ListExpensesInput, UpdateExpenseInput } from '../../types/expenseTypes';
import type { VehicleTokenContext } from '../../types/vehicleTokenTypes';

const parseOptionalInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const driverPortalCreateExpenseMapper = (
  req: Request,
  ctx: VehicleTokenContext,
  organizationId: string,
): CreateExpenseInput => ({
  organizationId,
  vehicleId: ctx.vehicleId,
  driverId: ctx.driverId ?? undefined,
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

export const driverPortalListExpensesMapper = (
  req: Request,
  ctx: VehicleTokenContext,
  organizationId: string,
): ListExpensesInput => {
  const query = req.query;

  const page = parseOptionalInt(query['page']) ?? 1;
  const limit = parseOptionalInt(query['limit']) ?? 25;

  const rawSort = typeof query['sort'] === 'string' ? query['sort'] : 'date';
  const sort = (['date', 'amount', 'category'] as const).includes(
    rawSort as 'date' | 'amount' | 'category',
  )
    ? (rawSort as 'date' | 'amount' | 'category')
    : 'date';

  const rawOrder = typeof query['order'] === 'string' ? query['order'] : 'desc';
  const order: SortOrder = rawOrder === 'asc' ? 'asc' : 'desc';

  return {
    organizationId,
    vehicleId: ctx.vehicleId,
    driverId: ctx.driverId ?? undefined,
    dateFrom: query['dateFrom'] as string | undefined,
    dateTo: query['dateTo'] as string | undefined,
    category: query['category'] as ExpenseCategory | undefined,
    page,
    limit: Math.min(limit, 100),
    sort,
    order,
  };
};

export const driverPortalUpdateExpenseMapper = (
  req: Request,
  ctx: VehicleTokenContext,
  organizationId: string,
): UpdateExpenseInput => ({
  id: req.params['id'] ?? '',
  organizationId,
  vehicleId: ctx.vehicleId,
  driverId: ctx.driverId ?? undefined,
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
