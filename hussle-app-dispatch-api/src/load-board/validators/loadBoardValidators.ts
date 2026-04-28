import * as yup from 'yup';

const LOAD_SOURCES = ['relay', 'dat'] as const;

const locationSchema = yup
  .object({
    city: yup.string().nullable(),
    state: yup.string().required('Location state is required'),
  })
  .required();

const datLoadSchema = yup
  .object({
    matchId: yup.string().required('matchId is required for DAT loads'),
    origin: locationSchema,
    destination: locationSchema,
    equipmentTypeCode: yup.string().nullable(),
  })
  .unknown(true);

const relayLoadSchema = yup
  .object({
    id: yup.string().required('id is required for Relay loads'),
    startLocation: locationSchema,
    endLocation: locationSchema,
    loads: yup
      .array()
      .of(yup.object().unknown(true))
      .min(1, 'Relay record must contain at least one load'),
  })
  .unknown(true);

export const ingestValidator = yup.object({
  body: yup.object({
    source: yup
      .string()
      .oneOf([...LOAD_SOURCES], 'Source must be relay or dat')
      .required('Source is required'),
    loads: yup
      .array()
      .max(100, 'Maximum 100 loads per ingest')
      .when('source', {
        is: 'dat',
        then: (schema) => schema.of(datLoadSchema).required('Loads array is required'),
        otherwise: (schema) => schema.of(relayLoadSchema).required('Loads array is required'),
      }),
  }),
});

export const getFeedValidator = yup.object({
  query: yup.object({
    source: yup
      .string()
      .oneOf([...LOAD_SOURCES], 'Source must be relay or dat')
      .notRequired(),
  }),
});

export const getLoadDetailValidator = yup.object({
  params: yup.object({
    id: yup.string().required('Load ID is required'),
  }),
});

export const clearSourceValidator = yup.object({
  params: yup.object({
    source: yup
      .string()
      .oneOf([...LOAD_SOURCES], 'Source must be relay or dat')
      .required('Source is required'),
  }),
});
