import * as Yup from 'yup';

const PORTAL_DOCUMENT_TYPES = [
  'DISPATCH_AGREEMENT',
  'INSURANCE_CERT',
  'W9',
  'CARRIER_PACKET',
] as const;

export const presignDocumentValidator = Yup.object({
  body: Yup.object({
    fileName: Yup.string().required('fileName is required'),
    contentType: Yup.string().required('contentType is required'),
    documentType: Yup.string()
      .oneOf([...PORTAL_DOCUMENT_TYPES], 'Invalid document type')
      .required('documentType is required'),
  }),
});

export const confirmDocumentValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid UUID').required('id is required'),
  }),
  body: Yup.object({
    documentType: Yup.string()
      .oneOf([...PORTAL_DOCUMENT_TYPES], 'Invalid document type')
      .required('documentType is required'),
    insuranceExpiry: Yup.string().optional(),
    coverageConfirmed: Yup.boolean().optional(),
  }),
});

export const signDocumentValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid UUID').required('id is required'),
  }),
  body: Yup.object({
    signatureData: Yup.string().required('signatureData is required'),
    consentGiven: Yup.boolean()
      .oneOf([true], 'Consent is required')
      .required('consentGiven is required'),
    signerName: Yup.string().optional(),
    signerTitle: Yup.string().optional(),
  }),
});
