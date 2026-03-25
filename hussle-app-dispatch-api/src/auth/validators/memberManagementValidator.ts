import * as Yup from 'yup';

export const changeRoleValidator = Yup.object({
  params: Yup.object({
    organizationId: Yup.string().required('Organization ID is required'),
    membershipId: Yup.string().required('Membership ID is required'),
  }),
  body: Yup.object({
    role: Yup.string()
      .oneOf(['admin', 'dispatcher', 'viewer', 'driver'])
      .required('Role is required'),
  }),
});

export const removeMemberValidator = Yup.object({
  params: Yup.object({
    organizationId: Yup.string().required('Organization ID is required'),
    membershipId: Yup.string().required('Membership ID is required'),
  }),
});
