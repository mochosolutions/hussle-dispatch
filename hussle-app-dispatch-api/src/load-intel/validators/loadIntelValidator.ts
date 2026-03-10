import * as yup from 'yup';
import { LOAD_SOURCES } from '../../shared/constants/loadSources';
import { EQUIPMENT_TYPES } from '../../shared/constants/equipmentTypes';

const geoPointSchema = yup.object({
  city: yup.string().required('City is required').trim().min(1),
  state: yup
    .string()
    .required('State is required')
    .trim()
    .length(2, 'State must be a 2-letter abbreviation'),
});

const brokerSchema = yup.object({
  name: yup.string().required('Broker name is required').trim().min(1),
  mc: yup.string().required('Broker MC is required').trim().min(1),
});

export const loadIntelPayloadSchema = yup.object({
  source: yup
    .string()
    .oneOf([...LOAD_SOURCES], 'Invalid load source')
    .required('Source is required'),
  origin: geoPointSchema.required('Origin is required'),
  dest: geoPointSchema.required('Destination is required'),
  pickupDate: yup
    .string()
    .required('Pickup date is required')
    .matches(/^\d{4}-\d{2}-\d{2}/, 'Pickup date must be in YYYY-MM-DD format'),
  deliveryDate: yup
    .string()
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}/, 'Delivery date must be in YYYY-MM-DD format'),
  equipmentType: yup
    .string()
    .oneOf([...EQUIPMENT_TYPES], 'Invalid equipment type')
    .required('Equipment type is required'),
  rate: yup.number().optional().positive('Rate must be positive'),
  loadedMiles: yup.number().optional().positive('Loaded miles must be positive').integer(),
  broker: brokerSchema.optional().default(undefined),
  brokerPhone: yup.string().optional().trim(),
  weight: yup.number().optional().positive('Weight must be positive').integer(),
  metadata: yup.object().optional(),
});
