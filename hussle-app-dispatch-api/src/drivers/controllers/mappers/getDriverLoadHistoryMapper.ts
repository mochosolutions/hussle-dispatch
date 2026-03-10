import type { Request } from 'express';
import { UnauthorizedError, ValidationError } from '@/shared/errors';

export interface DriverLoadHistoryInput {
  driverId: string;
  organizationId: string;
  role: string;
  query: Request['query'];
}

export const getDriverLoadHistoryMapper = (req: Request): DriverLoadHistoryInput => {
  const organizationId = req.organizationId;
  const role = req.user?.role;

  if (organizationId === undefined || role === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const driverId = req.params['id'];

  if (driverId === undefined || driverId.length === 0) {
    throw new ValidationError('id is required');
  }

  return {
    driverId,
    organizationId,
    role,
    query: req.query,
  };
};
