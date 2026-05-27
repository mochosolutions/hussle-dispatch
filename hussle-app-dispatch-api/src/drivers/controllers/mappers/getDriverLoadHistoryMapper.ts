import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

export interface DriverLoadHistoryInput {
  driverId: string;
  organizationId: string;
  role: string;
  query: Request['query'];
}

export const getDriverLoadHistoryMapper = (req: Request): DriverLoadHistoryInput => {
  const driverId = req.params['id'];

  if (driverId === undefined || driverId.length === 0) {
    throw new ValidationError('id is required');
  }

  return {
    driverId,
    organizationId: req.organizationId ?? '',
    role: req.user?.role ?? '',
    query: req.query,
  };
};
