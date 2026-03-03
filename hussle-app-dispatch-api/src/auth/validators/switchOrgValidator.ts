import * as Yup from 'yup';

const switchOrgSchema = Yup.object({
  organizationId: Yup.string().required('Organization ID is required.'),
});

export const switchOrgValidator = Yup.object({
  body: switchOrgSchema,
});
