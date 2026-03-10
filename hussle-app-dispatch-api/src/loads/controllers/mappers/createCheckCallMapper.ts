import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import type { CreateCheckCallServiceInput } from '../../types/loadServiceTypes';
import type { CreateCheckCallInput } from '../../types/loadTypes';

export const createCheckCallMapper = (req: Request): CreateCheckCallServiceInput => {
  const organizationId = req.organizationId;
  const userId = req.user?.userId;
  const loadId = req.params['id'];

  if (organizationId === undefined || userId === undefined || loadId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const input: CreateCheckCallInput = {
    location: req.body.location,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    status: req.body.status,
    eta: req.body.eta !== undefined ? new Date(req.body.eta) : undefined,
    notes: req.body.notes,
    brokerNotified: req.body.brokerNotified,
    brokerNotes: req.body.brokerNotes,
  };

  return {
    loadId,
    organizationId,
    userId,
    input,
  };
};
