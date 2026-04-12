import * as Yup from 'yup';

export const deadheadToValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  query: Yup.object({
    lat: Yup.number()
      .required('lat is required')
      .min(-90, 'lat must be between -90 and 90')
      .max(90, 'lat must be between -90 and 90'),
    lng: Yup.number()
      .required('lng is required')
      .min(-180, 'lng must be between -180 and 180')
      .max(180, 'lng must be between -180 and 180'),
  }),
});
