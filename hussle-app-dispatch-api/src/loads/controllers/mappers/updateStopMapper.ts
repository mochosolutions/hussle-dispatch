import type { Request } from 'express';
import type { UpdateStopInput } from '../../types/stopTypes';

export const updateStopMapper = (req: Request): UpdateStopInput => ({
  id: req.params['stopId'] ?? '',
  organizationId: req.organizationId ?? '',
  type: req.body.type,
  sequence: req.body.sequence,
  contactId: req.body.contactId,
  placeId: req.body.placeId,
  facilityName: req.body.facilityName,
  address: req.body.address,
  city: req.body.city,
  state: req.body.state,
  zip: req.body.zip,
  schedulingType: req.body.schedulingType,
  appointmentStart: req.body.appointmentStart,
  appointmentEnd: req.body.appointmentEnd,
  targetDate: req.body.targetDate,
  notificationHours: req.body.notificationHours,
  appointmentNumber: req.body.appointmentNumber,
  arrivalTime: req.body.arrivalTime !== undefined
    ? new Date(req.body.arrivalTime)
    : undefined,
  departureTime: req.body.departureTime !== undefined
    ? new Date(req.body.departureTime)
    : undefined,
  contactName: req.body.contactName,
  contactPhone: req.body.contactPhone,
  commodity: req.body.commodity,
  weight: req.body.weight,
  pieceCount: req.body.pieceCount,
  isHazmat: req.body.isHazmat,
  isTarp: req.body.isTarp,
  isTempControlled: req.body.isTempControlled,
  notes: req.body.notes,
});
