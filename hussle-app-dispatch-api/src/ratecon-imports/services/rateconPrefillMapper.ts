import type {
  ExtractionReferenceNumber,
  ExtractionStop,
  RateconExtractionResult,
  RateconPrefill,
  RateconPrefillStop,
} from '../types/rateconImportTypes';

const REF_PRIORITY: ExtractionReferenceNumber['kind'][] = [
  'LOAD_NUMBER',
  'ORDER_NUMBER',
  'PICKUP_NUMBER',
  'PO_NUMBER',
  'BOL_NUMBER',
  'OTHER',
];

const pickExternalRef = (refs: ExtractionReferenceNumber[]): string | null => {
  for (const kind of REF_PRIORITY) {
    const match = refs.find((ref) => ref.kind === kind);
    if (match !== undefined) {
      return match.value;
    }
  }
  return null;
};

// Extraction returns phones in E.164 (+1XXXXXXXXXX). The Create Load form's
// phone field uses a fixed 10-digit US mask, which would absorb the leading
// country code into the area code and drop the last digit. Strip a US country
// code so the mask renders the national number correctly.
const toNationalPhone = (phone: string | null): string | null => {
  if (phone === null) {
    return null;
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits.length === 0 ? null : digits;
};

const mapStop = (stop: ExtractionStop): RateconPrefillStop => ({
  type: stop.type,
  sequence: stop.sequence,
  facilityName: stop.facility_name,
  address: stop.address,
  city: stop.city,
  state: stop.state,
  zip: stop.zip,
  appointmentDate: stop.appointment_date,
  appointmentTime: stop.appointment_time,
  appointmentEndTime: stop.appointment_end_time,
  schedulingType: stop.scheduling_type,
  appointmentNumber: stop.appointment_number,
  contactName: stop.contact_name,
  contactPhone: toNationalPhone(stop.contact_phone),
  commodity: stop.commodity,
  weight: stop.weight_lbs,
  pieceCount: stop.piece_count,
  isHazmat: stop.is_hazmat,
  isTarp: stop.is_tarp,
  isTempControlled: stop.is_temp_controlled,
  notes: stop.notes,
});

export const buildPrefill = (
  result: RateconExtractionResult,
  matchedCustomerId: string | null,
): RateconPrefill => ({
  externalRefNumber: pickExternalRef(result.reference_numbers),
  customerRate: result.customer_rate,
  equipmentType: result.equipment_type,
  commodity: result.commodity,
  weight: result.weight_lbs,
  pieceCount: result.piece_count,
  isHazmat: result.is_hazmat,
  isTarp: result.is_tarp,
  isTeamDriver: result.is_team_driver,
  reeferTempMin: result.reefer_temp_min_f,
  reeferTempMax: result.reefer_temp_max_f,
  reeferMode: result.reefer_mode,
  reeferPrecool: result.reefer_precool_f,
  dispatcherNotes: result.dispatcher_notes,
  driverInstructions: result.driver_instructions,
  stops: result.stops.map(mapStop),
  customerHint: {
    companyName: result.customer?.company_name ?? null,
    mcNumber: result.customer?.mc_number ?? null,
    dotNumber: result.customer?.dot_number ?? null,
    matchedCustomerId,
  },
});

export interface RateconCardSummary {
  brokerName: string | null;
  laneSummary: string | null;
  customerRate: number | null;
  pickupDate: Date | null;
}

const formatLane = (stops: ExtractionStop[]): string | null => {
  const located = stops.filter((s) => s.city !== null || s.state !== null);
  const first = located[0];
  if (first === undefined) {
    return null;
  }
  const last = located[located.length - 1] ?? first;
  const label = (s: ExtractionStop) => [s.city, s.state].filter(Boolean).join(', ');
  return located.length === 1 ? label(first) : `${label(first)} → ${label(last)}`;
};

const firstPickupDate = (stops: ExtractionStop[]): Date | null => {
  const pickup = stops.find((s) => s.type === 'PICKUP' && s.appointment_date !== null);
  const dateStr = pickup?.appointment_date ?? null;
  if (dateStr === null) {
    return null;
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Denormalized fields stored on the import row for fast card rendering. */
export const buildCardSummary = (result: RateconExtractionResult): RateconCardSummary => ({
  brokerName: result.customer?.company_name ?? null,
  laneSummary: formatLane(result.stops),
  customerRate: result.customer_rate,
  pickupDate: firstPickupDate(result.stops),
});
