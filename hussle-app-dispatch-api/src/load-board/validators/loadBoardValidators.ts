import * as yup from 'yup';

const LOAD_SOURCES = ['relay', 'dat'] as const;

export const ingestValidator = yup.object({
  body: yup.object({
    source: yup
      .string()
      .oneOf([...LOAD_SOURCES], 'Source must be relay or dat')
      .required('Source is required'),
    loads: yup
      .array()
      .of(yup.mixed())
      .max(100, 'Maximum 100 loads per ingest')
      .required('Loads array is required'),
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
