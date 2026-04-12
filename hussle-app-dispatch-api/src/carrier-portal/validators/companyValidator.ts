import * as Yup from 'yup';

export const companyValidator = Yup.object({
  body: Yup.object({
    name: Yup.string().required('name is required').max(255),
    mcNumber: Yup.string()
      .optional()
      .matches(/^[0-9]{1,8}$/, 'mcNumber must be 1-8 digits'),
    dotNumber: Yup.string()
      .optional()
      .matches(/^[0-9]{1,8}$/, 'dotNumber must be 1-8 digits'),
    ein: Yup.string()
      .optional()
      .matches(/^[0-9]{2}-?[0-9]{7}$/, 'ein must be in format XX-XXXXXXX'),
    phone: Yup.string().optional(),
    email: Yup.string().optional(),
    address: Yup.string().optional(),
    city: Yup.string().optional(),
    state: Yup.string().optional().length(2, 'state must be exactly 2 characters'),
    zip: Yup.string()
      .optional()
      .matches(/^[0-9]{5}(-[0-9]{4})?$/, 'zip must be in format XXXXX or XXXXX-XXXX'),
    primaryContactName: Yup.string().optional(),
    primaryContactPhone: Yup.string().optional(),
    primaryContactEmail: Yup.string().optional(),
    factoringCompanyName: Yup.string().optional(),
    factoringCompanyEmail: Yup.string().optional(),
    factoringSubmissionMethod: Yup.string().optional(),
    factoringAdvanceRate: Yup.number().min(0).max(100).optional(),
    factoringFeePercent: Yup.number().min(0).max(100).optional(),
    fuelCardProviders: Yup.array().of(Yup.string().required()).optional(),
    howFoundUs: Yup.string().optional(),
  }),
});
