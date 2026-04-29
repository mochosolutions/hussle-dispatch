import { DocumentType } from '@prisma/client';
import * as Yup from 'yup';
import { ALLOWED_MIME_TYPES } from '../types/documentTypes';

const documentTypeValues = Object.values(DocumentType);

const ENTITY_TYPES = ['load', 'carrier', 'driver', 'vehicle'] as const;

export const presignValidator = Yup.object({
  body: Yup.object({
    fileName: Yup.string().trim().required('fileName is required'),
    mimeType: Yup.string()
      .trim()
      .oneOf([...ALLOWED_MIME_TYPES], 'mimeType must be one of: application/pdf, image/png, image/jpeg, image/jpg')
      .required('mimeType is required'),
    type: Yup.mixed<DocumentType>()
      .oneOf(documentTypeValues, 'type must be a valid DocumentType')
      .required('type is required'),
    entityType: Yup.string()
      .oneOf([...ENTITY_TYPES], 'entityType must be one of: load, carrier, driver, vehicle')
      .required('entityType is required'),
    entityId: Yup.string().uuid('entityId must be a valid uuid').required('entityId is required'),
    expiresAt: Yup.string().optional(),
    metadata: Yup.object().optional(),
    fileSize: Yup.number().integer().positive().optional(),
  }),
});

export const confirmValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    expiresAt: Yup.string().optional(),
    metadata: Yup.object().optional(),
  }),
});

export const documentIdValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listDocumentsValidator = Yup.object({
  query: Yup.object({
    entityType: Yup.string()
      .oneOf([...ENTITY_TYPES], 'entityType must be one of: load, carrier, driver, vehicle')
      .optional(),
    entityId: Yup.string().uuid('entityId must be a valid uuid').optional(),
    type: Yup.string().optional(),
    expiringBefore: Yup.string().optional(),
    includeArchived: Yup.boolean().notRequired(),
  }),
});

export const bulkDownloadValidator = Yup.object({
  body: Yup.object({
    documentIds: Yup.array()
      .of(Yup.string().uuid('each documentId must be a valid uuid').required())
      .min(1, 'at least one documentId is required')
      .max(50, 'cannot exceed 50 documentIds')
      .required('documentIds is required'),
  }),
});
