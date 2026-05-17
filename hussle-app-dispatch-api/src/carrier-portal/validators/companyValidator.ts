import * as Yup from 'yup';

export const companyValidator = Yup.object({
  body: Yup.object({
    // `name` is derived from dbaName ?? legalName on the server; accept it for
    // backward compatibility but treat as optional.
    name: Yup.string().optional().max(255),
    legalName: Yup.string().nullable().optional().max(255),
    dbaName: Yup.string().nullable().optional().max(255),
    taxClassification: Yup.string().nullable().optional().max(64),
    tin: Yup.string()
      .nullable()
      .optional()
      .matches(/^[0-9]{2}-[0-9]{7}$|^[0-9]{3}-[0-9]{2}-[0-9]{4}$/, 'tin must be EIN or SSN format'),
    tinType: Yup.string().nullable().optional().oneOf(['EIN', 'SSN', null] as Array<string | null>),
    signatoryName: Yup.string().nullable().optional().max(255),
    signatoryTitle: Yup.string().nullable().optional().max(255),
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
    lat: Yup.number().nullable().optional(),
    lng: Yup.number().nullable().optional(),
  }),
});
