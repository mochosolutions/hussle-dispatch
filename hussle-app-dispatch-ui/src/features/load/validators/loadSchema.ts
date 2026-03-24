import * as Yup from 'yup';
import { EQUIPMENT_OPTIONS } from '../constants';

const EQUIPMENT_VALUES = EQUIPMENT_OPTIONS.map((opt) => opt.value);

// ---------------------------------------------------------------------------
// Commodity schema (per-stop commodity entries)
// ---------------------------------------------------------------------------

const commoditySchema = Yup.object().shape({
  description: Yup.string().default(''),
  weight: Yup.string().default(''),
  pieces: Yup.string().default(''),
  nmfc: Yup.string().default(''),
  isHazmat: Yup.boolean().default(false),
  isTarp: Yup.boolean().default(false),
  isTempControlled: Yup.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Stop schema
// ---------------------------------------------------------------------------

const stopSchema = Yup.object().shape({
  type: Yup.string()
    .oneOf(['PICKUP', 'DELIVERY', 'STOP_OFF', 'DROP_HOOK', 'LIVE_UNLOAD'])
    .required('Stop type is required'),
  sequence: Yup.number().required('Sequence is required').min(0),
  contactId: Yup.string().uuid('Must be a valid ID'),
  placeId: Yup.string().uuid('Must be a valid ID'),
  facilityName: Yup.string(),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  zip: Yup.string(),
  appointmentDate: Yup.string(),
  appointmentTime: Yup.string(),
  appointmentNumber: Yup.string(),
  contactName: Yup.string(),
  contactPhone: Yup.string(),
  notes: Yup.string(),
  commodity: Yup.string(),
  weight: Yup.string(),
  pieceCount: Yup.string(),
  commodities: Yup.array().of(commoditySchema).default([]),
  receivingCommodityIds: Yup.array().of(Yup.string()).default([]),
  lat: Yup.number().nullable(),
  lng: Yup.number().nullable(),
});

// ---------------------------------------------------------------------------
// Accessorial schema (UI form entry)
// ---------------------------------------------------------------------------

const accessorialFormSchema = Yup.object().shape({
  type: Yup.string().required(),
  label: Yup.string().default(''),
  amount: Yup.number().min(0).default(0),
  applies: Yup.string().oneOf(['carrier', 'customer', 'both']).default('both'),
});

// ---------------------------------------------------------------------------
// Load schema
// ---------------------------------------------------------------------------

export const loadSchema = Yup.object().shape({
  carrierId: Yup.string().required('Carrier is required'),
  driverId: Yup.string(),
  vehicleId: Yup.string(),
  customerId: Yup.string(),
  contactId: Yup.string(),
  externalRefNumber: Yup.string(),
  equipmentType: Yup.string()
    .oneOf(EQUIPMENT_VALUES)
    .required('Equipment type is required'),
  isHazmat: Yup.boolean(),
  isTarp: Yup.boolean(),
  isTeamDriver: Yup.boolean(),
  commodity: Yup.string().when('isHazmat', {
    is: true,
    then: (schema) => schema.required('Commodity is required for hazmat loads'),
  }),
  weight: Yup.number().positive('Weight must be positive'),
  pieceCount: Yup.number().integer('Must be a whole number').min(0),
  loadedMiles: Yup.number().min(0),
  deadheadMiles: Yup.number().min(0),
  totalMiles: Yup.number().min(0),
  customerRate: Yup.number().min(0).required('Customer rate is required'),
  carrierRate: Yup.number().min(0),
  dispatchFee: Yup.number().min(0),
  partnerSplit: Yup.number().min(0),
  ratePerMile: Yup.number().min(0),
  dispatcherNotes: Yup.string(),
  driverInstructions: Yup.string(),
  stops: Yup.array()
    .of(stopSchema)
    .required('At least one stop is required')
    .test(
      'has-pickup',
      'At least one pickup stop is required',
      (stops) => {
        if (!stops) {
          return false;
        }
        return stops.some((stop) => stop.type === 'PICKUP');
      },
    )
    .test(
      'has-delivery',
      'At least one delivery stop is required',
      (stops) => {
        if (!stops) {
          return false;
        }
        return stops.some((stop) => stop.type === 'DELIVERY');
      },
    ),
  // UI-only load fields
  loadType: Yup.string().oneOf(['std', 'mp1d', '1pmd', 'mpmd', 'dh', 'po']),
  reeferTempMin: Yup.number(),
  reeferTempMax: Yup.number(),
  reeferPrecool: Yup.number(),
  reeferMode: Yup.string().oneOf(['continuous', 'cycle-sentry']),
  flatbedLength: Yup.number().oneOf([48, 53]),
  flatbedTarpType: Yup.string(),
  flatbedStraps: Yup.string(),
  carrierPercent: Yup.number().min(0).max(100).default(80),
  paymentTerms: Yup.string().oneOf(['quick_pay', 'net_15', 'net_30', 'net_45']),
  queuedDocuments: Yup.array().default([]),
  accessorials: Yup.array().of(accessorialFormSchema).default([]),
  calculatedTotalMiles: Yup.number().nullable(),
  isMilesEstimated: Yup.boolean().default(false),
  hazmatDocFile: Yup.mixed().nullable(),
});

export type LoadFormValues = Yup.InferType<typeof loadSchema>;
