import { buildCardSummary, buildPrefill } from '../rateconPrefillMapper';
import type {
  ExtractionStop,
  RateconExtractionResult,
} from '../../types/rateconImportTypes';

const makeStop = (overrides: Partial<ExtractionStop> = {}): ExtractionStop => ({
  sequence: 1,
  type: 'PICKUP',
  facility_name: 'Del Monte',
  address: '1 Dock Rd',
  city: 'Eddystone',
  state: 'PA',
  zip: '19022',
  appointment_date: '2026-04-09',
  appointment_date_raw: '04/09/2026',
  appointment_time: '23:59',
  appointment_time_raw: '11:59 PM',
  appointment_end_time: null,
  scheduling_type: 'APPOINTMENT',
  appointment_number: 'A-1',
  contact_name: 'Joe',
  contact_phone: '555-1212',
  commodity: 'Produce',
  weight_lbs: 42000,
  piece_count: 24,
  is_hazmat: false,
  is_tarp: false,
  is_temp_controlled: true,
  notes: 'Dock 4',
  ...overrides,
});

const makeResult = (overrides: Partial<RateconExtractionResult> = {}): RateconExtractionResult => ({
  is_ratecon: true,
  document_type_guess: null,
  extraction_confidence: 'HIGH',
  requires_review: false,
  warnings: [],
  customer_rate: 800,
  customer_rate_raw: '$800.00',
  equipment_type: 'REEFER',
  commodity: 'Produce',
  weight_lbs: 42000,
  piece_count: 24,
  is_hazmat: false,
  is_tarp: false,
  is_team_driver: false,
  reefer_temp_min_f: 38,
  reefer_temp_max_f: 38,
  reefer_mode: 'continuous',
  reefer_precool_f: 38,
  dispatcher_notes: 'Net 30',
  driver_instructions: 'Pre-cool to 38F',
  reference_numbers: [{ kind: 'LOAD_NUMBER', value: '15915025', label: 'Load #' }],
  stops: [
    makeStop({ sequence: 1, type: 'PICKUP', city: 'Eddystone', state: 'PA' }),
    makeStop({
      sequence: 2,
      type: 'DELIVERY',
      city: 'North Bergen',
      state: 'NJ',
      appointment_date: '2026-04-10',
      appointment_time: '03:00',
    }),
  ],
  customer: { company_name: 'Sunteck Transport', mc_number: '01145125', dot_number: '3485096' },
  carrier_name_on_doc: null,
  carrier_mc_number: null,
  ...overrides,
});

describe('buildPrefill', () => {
  it('maps top-level fields and customer hint without setting a customerId', () => {
    const prefill = buildPrefill(makeResult(), null);

    expect(prefill.customerRate).toBe(800);
    expect(prefill.equipmentType).toBe('REEFER');
    expect(prefill.reeferTempMin).toBe(38);
    expect(prefill.reeferMode).toBe('continuous');
    expect(prefill.dispatcherNotes).toBe('Net 30');
    expect(prefill.customerHint).toEqual({
      companyName: 'Sunteck Transport',
      mcNumber: '01145125',
      dotNumber: '3485096',
      matchedCustomerId: null,
    });
  });

  it('surfaces the matched customer id in the hint when provided', () => {
    const prefill = buildPrefill(makeResult(), 'cust-42');

    expect(prefill.customerHint.matchedCustomerId).toBe('cust-42');
  });

  it('maps stop fields snake_case to camelCase preserving order', () => {
    const prefill = buildPrefill(makeResult(), null);

    expect(prefill.stops).toHaveLength(2);
    const [pickup, delivery] = prefill.stops;
    expect(pickup).toMatchObject({
      type: 'PICKUP',
      facilityName: 'Del Monte',
      appointmentDate: '2026-04-09',
      appointmentTime: '23:59',
      isTempControlled: true,
      weight: 42000,
    });
    expect(delivery?.type).toBe('DELIVERY');
    expect(delivery?.city).toBe('North Bergen');
  });

  it('strips the US country code from E.164 contact phones to a 10-digit national number', () => {
    const result = makeResult({
      stops: [
        makeStop({ type: 'PICKUP', contact_phone: '+17185550233' }),
        makeStop({ type: 'DELIVERY', contact_phone: '+16315550181' }),
      ],
    });

    const [pickup, delivery] = buildPrefill(result, null).stops;

    expect(pickup?.contactPhone).toBe('7185550233');
    expect(delivery?.contactPhone).toBe('6315550181');
  });

  it('passes through a null contact phone unchanged', () => {
    const result = makeResult({ stops: [makeStop({ contact_phone: null })] });

    expect(buildPrefill(result, null).stops[0]?.contactPhone).toBeNull();
  });

  it('prefers LOAD_NUMBER over other reference kinds for externalRefNumber', () => {
    const result = makeResult({
      reference_numbers: [
        { kind: 'PO_NUMBER', value: 'PO-1', label: 'PO' },
        { kind: 'LOAD_NUMBER', value: 'LOAD-9', label: 'Load #' },
        { kind: 'ORDER_NUMBER', value: 'ORD-5', label: 'Order' },
      ],
    });

    expect(buildPrefill(result, null).externalRefNumber).toBe('LOAD-9');
  });

  it('falls back through the reference priority when LOAD_NUMBER is absent', () => {
    const result = makeResult({
      reference_numbers: [
        { kind: 'PO_NUMBER', value: 'PO-1', label: 'PO' },
        { kind: 'ORDER_NUMBER', value: 'ORD-5', label: 'Order' },
      ],
    });

    expect(buildPrefill(result, null).externalRefNumber).toBe('ORD-5');
  });

  it('returns null externalRefNumber when there are no references', () => {
    expect(buildPrefill(makeResult({ reference_numbers: [] }), null).externalRefNumber).toBeNull();
  });
});

describe('buildCardSummary', () => {
  it('denormalizes broker, lane, rate, and first pickup date', () => {
    const card = buildCardSummary(makeResult());

    expect(card.brokerName).toBe('Sunteck Transport');
    expect(card.laneSummary).toBe('Eddystone, PA → North Bergen, NJ');
    expect(card.customerRate).toBe(800);
    expect(card.pickupDate?.toISOString().slice(0, 10)).toBe('2026-04-09');
  });

  it('returns a single-location lane when only one stop is located', () => {
    const result = makeResult({ stops: [makeStop({ city: 'Eddystone', state: 'PA' })] });

    expect(buildCardSummary(result).laneSummary).toBe('Eddystone, PA');
  });

  it('returns null pickup date when no pickup has an appointment date', () => {
    const result = makeResult({
      stops: [makeStop({ type: 'PICKUP', appointment_date: null })],
    });

    expect(buildCardSummary(result).pickupDate).toBeNull();
  });

  it('returns null broker name when no customer was extracted', () => {
    expect(buildCardSummary(makeResult({ customer: null })).brokerName).toBeNull();
  });
});
