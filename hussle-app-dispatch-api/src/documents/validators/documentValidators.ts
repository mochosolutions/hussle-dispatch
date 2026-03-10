import { DocumentType } from '@prisma/client';
import * as Yup from 'yup';
import { ALLOWED_MIME_TYPES } from '../types/documentTypes';

const documentTypeValues = Object.values(DocumentType);

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
    loadId: Yup.string().uuid('loadId must be a valid uuid').notRequired(),
    carrierId: Yup.string().uuid('carrierId must be a valid uuid').notRequired(),
  }),
});

export const confirmValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listDocumentsValidator = Yup.object({
  query: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').notRequired(),
    carrierId: Yup.string().uuid('carrierId must be a valid uuid').notRequired(),
    type: Yup.mixed<DocumentType>().oneOf(documentTypeValues).notRequired(),
    includeArchived: Yup.boolean().notRequired(),
  }),
});
