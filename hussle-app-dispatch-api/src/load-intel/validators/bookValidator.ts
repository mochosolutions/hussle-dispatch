import * as yup from 'yup';
import { EQUIPMENT_TYPES } from '../../shared/constants/equipmentTypes';

export const bookLoadParamValidator = yup.object({
  params: yup.object({
    id: yup.string().required('id is required'),
  }),
});

export const manualLoadIntelValidator = yup.object({
  body: yup.object({
    origin: yup.object({
      city: yup.string().required('Origin city is required').trim().min(1),
      state: yup.string().required('Origin state is required').trim().length(2),
    }).required('Origin is required'),
    dest: yup.object({
      city: yup.string().required('Destination city is required').trim().min(1),
      state: yup.string().required('Destination state is required').trim().length(2),
    }).required('Destination is required'),
    pickupDate: yup
      .string()
      .required('Pickup date is required')
      .matches(/^\d{4}-\d{2}-\d{2}/, 'Pickup date must be in YYYY-MM-DD format'),
    equipmentType: yup
      .string()
      .oneOf([...EQUIPMENT_TYPES], 'Invalid equipment type')
      .required('Equipment type is required'),
    rate: yup.number().positive('Rate must be positive').notRequired(),
    miles: yup.number().positive('Miles must be positive').integer().notRequired(),
    broker: yup.string().trim().notRequired(),
  }),
});

export const ingestSingleValidator = yup.object({
  body: yup.object().required('Payload is required'),
});

export const ingestBatchValidator = yup.object({
  body: yup.array().of(yup.object()).min(1, 'At least one payload is required').required(),
});
