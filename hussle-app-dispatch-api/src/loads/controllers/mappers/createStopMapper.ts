import type { Request } from 'express';
import type { CreateStopInput } from '../../types/stopTypes';
import { UnauthorizedError } from '@/shared/errors';

export const createStopMapper = (req: Request): CreateStopInput => {
  const organizationId = req.organizationId;
  const loadId = req.params['loadId'];

  if (organizationId === undefined || loadId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return {
    organizationId,
    loadId,
    type: req.body.type,
    sequence: req.body.sequence,
    contactId: req.body.contactId,
    placeId: req.body.placeId,
    facilityName: req.body.facilityName,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    appointmentDate: req.body.appointmentDate !== undefined
      ? new Date(req.body.appointmentDate)
      : undefined,
    appointmentTime: req.body.appointmentTime,
    appointmentNumber: req.body.appointmentNumber,
    contactName: req.body.contactName,
    contactPhone: req.body.contactPhone,
    notes: req.body.notes,
  };
};
