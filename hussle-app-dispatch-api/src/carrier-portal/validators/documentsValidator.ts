import * as Yup from 'yup';

const PORTAL_DOCUMENT_TYPES = [
  'DISPATCH_AGREEMENT',
  'INSURANCE_CERT',
  'W9',
  'CARRIER_PACKET',
] as const;

const ENTITY_TYPES = ['load', 'carrier', 'driver', 'vehicle'] as const;

export const presignDocumentValidator = Yup.object({
  body: Yup.object({
    fileName: Yup.string().required('fileName is required'),
    mimeType: Yup.string().required('mimeType is required'),
    type: Yup.string()
      .oneOf([...PORTAL_DOCUMENT_TYPES], 'Invalid document type')
      .required('type is required'),
    entityType: Yup.string()
      .oneOf([...ENTITY_TYPES], 'Invalid entity type')
      .required('entityType is required'),
    entityId: Yup.string().uuid('entityId must be a valid UUID').required('entityId is required'),
  }),
});

export const confirmDocumentValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid UUID').required('id is required'),
  }),
  body: Yup.object({
    // The UI confirm-step API helper sends `{ key }` only; the server reads
    // documentType from the existing Document row by id rather than the
    // request body. Keep `type` accepted (legacy callers) but optional.
    key: Yup.string().optional(),
    type: Yup.string()
      .oneOf([...PORTAL_DOCUMENT_TYPES], 'Invalid document type')
      .optional(),
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
