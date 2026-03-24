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
    notes: stop.notes || undefined,
  }));

  // Map first pickup commodity to top-level fields
  const firstPickup = (values.stops ?? []).find((s) => s.type === 'PICKUP');
  const firstCommodity = firstPickup?.commodities?.[0];
  const commodity = firstCommodity?.description || values.commodity || undefined;
  const weight = firstCommodity?.weight
    ? Number(firstCommodity.weight) || undefined
    : values.weight || undefined;
  const pieceCount = firstCommodity?.pieces
    ? Number(firstCommodity.pieces) || undefined
    : values.pieceCount || undefined;
  const isHazmat =
    (values.stops ?? []).some(
      (s) => s.type === 'PICKUP' && (s.commodities ?? []).some((c) => c.isHazmat),
    ) || values.isHazmat;
  const isTarp =
    (values.stops ?? []).some(
      (s) => s.type === 'PICKUP' && (s.commodities ?? []).some((c) => c.isTarp),
    ) || values.isTarp;

  // Carrier rate is auto-calculated by RateSidebar and synced to formik
  const customerRate = Number(values.customerRate) || undefined;
  const carrierRate = Number(values.carrierRate) || undefined;

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
    isHazmat: isHazmat || false,
    isTarp: isTarp || false,
    isTeamDriver: values.isTeamDriver || false,
    commodity,
    weight: typeof weight === 'number' ? weight : undefined,
    pieceCount: typeof pieceCount === 'number' ? pieceCount : undefined,
    loadedMiles: values.loadedMiles || undefined,
    deadheadMiles: values.deadheadMiles || undefined,
    totalMiles: values.totalMiles || undefined,
    customerRate,
    carrierRate,
    dispatchFee: values.dispatchFee || undefined,
    partnerSplit: values.partnerSplit || undefined,
    ratePerMile: values.ratePerMile || undefined,
    dispatcherNotes: values.dispatcherNotes || undefined,
    driverInstructions: values.driverInstructions || undefined,
    stops,
    accessorialCharges,
  };
};
