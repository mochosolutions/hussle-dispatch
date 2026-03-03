import type { Driver } from '@prisma/client';
import type { PaginationMeta } from '@/shared/responseEnvelope';

export const toDriverResponse = (driver: Driver): Driver => ({
  ...driver,
});

export const toDriverListResponse = (drivers: Driver[]): Driver[] =>
  drivers.map((driver) => toDriverResponse(driver));

export const toDriverListEnvelope = (
  drivers: Driver[],
  meta: PaginationMeta,
): { data: Driver[]; meta: PaginationMeta } => ({
  data: toDriverListResponse(drivers),
  meta,
});
