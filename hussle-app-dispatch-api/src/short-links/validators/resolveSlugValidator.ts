import * as Yup from 'yup';

export const resolveSlugValidator = Yup.object({
  body: Yup.object({}).defined(),
  query: Yup.object({}).defined(),
  params: Yup.object({
    slug: Yup.string()
      .matches(/^[A-Za-z0-9]{8}$/, 'slug must be 8 alphanumeric characters')
      .required('slug is required'),
  }).defined(),
});
