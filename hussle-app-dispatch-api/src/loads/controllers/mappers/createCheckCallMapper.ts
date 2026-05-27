import type { Request } from 'express';
import type { CreateCheckCallServiceInput } from '../../types/loadServiceTypes';
import type { CreateCheckCallInput } from '../../types/loadTypes';

export const createCheckCallMapper = (req: Request): CreateCheckCallServiceInput => {
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
    loadId: req.params['id'] ?? '',
    organizationId: req.organizationId ?? '',
    userId: req.user?.userId ?? '',
    input,
  };
};
