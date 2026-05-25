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
    expiresAt: Yup.string().optional(),
    metadata: Yup.object().optional(),
  }),
});

export const confirmDocumentValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid UUID').required('id is required'),
  }),
  body: Yup.object({
    expiresAt: Yup.string().optional(),
    metadata: Yup.object().optional(),
  }),
});
