import type { Request } from 'express';
import type { CreateLoadInput } from '../../types/loadTypes';
import type { CreateLoadServiceInput } from '../../types/loadServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const createLoadMapper = (req: Request): CreateLoadServiceInput => {
  const context = getRequestContextMapper(req);
  const { body } = req;

  const input: CreateLoadInput = {
    carrierId: body.carrierId,
    driverId: body.driverId,
    vehicleId: body.vehicleId,
    contactId: body.contactId,
    customerId: body.customerId,
    dispatcherUserId: body.dispatcherUserId,
    externalRefNumber: body.externalRefNumber,
    equipmentType: body.equipmentType,
    isTeamDriver: body.isTeamDriver,
    loadedMiles: body.loadedMiles,
    deadheadMiles: body.deadheadMiles,
    totalMiles: body.totalMiles,
    customerRate: body.customerRate,
    carrierRate: body.carrierRate,
    status: body.status,
    rateConReceivedAt: body.rateConReceivedAt,
    bolUnsignedAt: body.bolUnsignedAt,
    bolSignedAt: body.bolSignedAt,
    dispatcherNotes: body.dispatcherNotes,
    driverInstructions: body.driverInstructions,
    stops: body.stops,
    accessorialCharges: body.accessorialCharges,
    dispatchFeeType: body.dispatchFeeType,
    dispatchFeeAmount: body.dispatchFeeAmount,
  };

  return { ...context, input };
};
