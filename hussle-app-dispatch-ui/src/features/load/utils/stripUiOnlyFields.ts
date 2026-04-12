import type { LoadFormValues } from '../validators/loadSchema';
import type { CreateLoadInput, StopType, AccessorialChargeInput } from '../types';

const APPLIES_TO_BILL_TO: Record<string, string> = {
  carrier: 'CARRIER',
  customer: 'CUSTOMER',
  both: 'BOTH',
};

/**
 * Strips UI-only fields from formik values and maps them to the API create load input.
 */
export const stripUiOnlyFields = (values: LoadFormValues): CreateLoadInput => {
  const stops = (values.stops ?? []).map((stop, idx) => ({
    type: stop.type as StopType,
    sequence: idx,
    contactId: stop.contactId || undefined,
    placeId: stop.placeId || undefined,
    facilityName: stop.facilityName || undefined,
    address: stop.address || undefined,
    city: stop.city || undefined,
    state: stop.state || undefined,
    zip: stop.zip || undefined,
    appointmentDate: stop.appointmentDate || undefined,
    appointmentTime: stop.appointmentTime || undefined,
    appointmentNumber: stop.appointmentNumber || undefined,
    contactName: stop.contactName || undefined,
    contactPhone: stop.contactPhone || undefined,
    commodity: stop.commodity || undefined,
    weight: stop.weight ? Number(stop.weight) : undefined,
    pieceCount: stop.pieceCount ? Number(stop.pieceCount) : undefined,
    isHazmat: stop.isHazmat ?? false,
    isTarp: stop.isTarp ?? false,
    isTempControlled: stop.isTempControlled ?? false,
    notes: stop.notes || undefined,
  }));

  const customerRate = Number(values.customerRate) || undefined;

  // Map accessorials
  const accessorialCharges: AccessorialChargeInput[] | undefined =
    (values.accessorials ?? []).length > 0
      ? (values.accessorials ?? []).map((a) => ({
          type: a.type as AccessorialChargeInput['type'],
          description: a.label || undefined,
          amount: Number(a.amount) || 0,
          billTo: APPLIES_TO_BILL_TO[a.applies ?? 'both'] ?? 'BOTH',
        }))
      : undefined;

  return {
    carrierId: values.carrierId || undefined,
    driverId: values.driverId || undefined,
    vehicleId: values.vehicleId || undefined,
    contactId: values.contactId || undefined,
    customerId: values.customerId || undefined,
    externalRefNumber: values.externalRefNumber || undefined,
    equipmentType: values.equipmentType as CreateLoadInput['equipmentType'],
    isTeamDriver: values.isTeamDriver || false,
    loadedMiles: values.loadedMiles || undefined,
    deadheadMiles: values.deadheadMiles || undefined,
    totalMiles: values.totalMiles || undefined,
    customerRate,
    dispatcherNotes: values.dispatcherNotes || undefined,
    driverInstructions: values.driverInstructions || undefined,
    stops,
    accessorialCharges,
  };
};
