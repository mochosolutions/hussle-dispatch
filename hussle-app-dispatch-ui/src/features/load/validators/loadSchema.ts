import * as Yup from 'yup';

const stopSchema = Yup.object().shape({
  type: Yup.string()
    .oneOf(['PICKUP', 'DELIVERY', 'STOP_OFF', 'DROP_HOOK', 'LIVE_UNLOAD'])
    .required('Stop type is required'),
  sequence: Yup.number().required('Sequence is required').min(0),
  contactId: Yup.string(),
  placeId: Yup.string(),
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
});

export const loadSchema = Yup.object().shape({
  carrierId: Yup.string(),
  driverId: Yup.string(),
  vehicleId: Yup.string(),
  brokerId: Yup.string(),
  shipperId: Yup.string(),
  consigneeId: Yup.string(),
  brokerRefNumber: Yup.string(),
  equipmentType: Yup.string().oneOf([
    'DRY_VAN',
    'REEFER',
    'FLATBED',
    'STEP_DECK',
    'BOX_TRUCK',
    'HOTSHOT',
    'POWER_ONLY',
  ]),
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
  customerRate: Yup.number().min(0),
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
});

export type LoadFormValues = Yup.InferType<typeof loadSchema>;
