import type { Request } from 'express';
import type { UpdateLoadInput } from '../../types/loadTypes';
import type { UpdateLoadServiceInput } from '../../types/loadServiceTypes';
import { getRequiredLoadIdMapper } from './getRequiredLoadIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const updateLoadMapper = (req: Request): UpdateLoadServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredLoadIdMapper(req);
  const { body } = req;

  const input: UpdateLoadInput = {
    carrierId: body.carrierId,
    driverId: body.driverId,
    vehicleId: body.vehicleId,
    contactId: body.contactId,
    customerId: body.customerId,
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
  };

  return { ...context, id, input };
};
