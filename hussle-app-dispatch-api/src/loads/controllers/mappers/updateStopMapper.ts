import type { Request } from 'express';
import type { UpdateStopInput } from '../../types/stopTypes';
import { UnauthorizedError } from '@/shared/errors';

export const updateStopMapper = (req: Request): UpdateStopInput => {
  const organizationId = req.organizationId;
  const stopId = req.params['stopId'];

  if (organizationId === undefined || stopId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return {
    id: stopId,
    organizationId,
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
    arrivalTime: req.body.arrivalTime !== undefined
      ? new Date(req.body.arrivalTime)
      : undefined,
    departureTime: req.body.departureTime !== undefined
      ? new Date(req.body.departureTime)
      : undefined,
    contactName: req.body.contactName,
    contactPhone: req.body.contactPhone,
    notes: req.body.notes,
  };
};
