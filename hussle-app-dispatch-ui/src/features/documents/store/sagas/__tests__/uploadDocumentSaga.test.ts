// ---------------------------------------------------------------------------
// US-06 T-18 — Dispatcher uploadDocumentSaga unit test.
//
// Covers:
//   - happy path: helper completes → documentActions.addOne + success + notify
//   - error path: helper throws → uploadDocumentFailure + error notify
// ---------------------------------------------------------------------------

import { expectSaga } from 'redux-saga-test-plan';

import { DocumentType, type Document } from 'features/documents/types';

import { uploadDocumentSaga } from '../uploadDocumentSaga';
import { documentActions } from '../../reducers/documentEntitySlice';
import {
  uploadDocumentSuccess,
  uploadDocumentFailure,
} from '../../reducers/documentPageSlice';

jest.mock('utils/api/documents/documentApi', () => ({
  presignDocument: jest.fn(),
  confirmDocument: jest.fn(),
  uploadDocumentToS3: jest.fn(),
}));

import {
  presignDocument,
  uploadDocumentToS3,
  confirmDocument,
} from 'utils/api/documents/documentApi';

const presignDocumentMock = presignDocument as jest.MockedFunction<typeof presignDocument>;
const confirmDocumentMock = confirmDocument as jest.MockedFunction<typeof confirmDocument>;
const uploadDocumentToS3Mock = uploadDocumentToS3 as jest.MockedFunction<typeof uploadDocumentToS3>;

const buildAction = () => ({
  type: 'documents/uploadDocument',
  payload: {
    file: new File(['hello'], 'invoice.pdf', { type: 'application/pdf' }),
    documentType: DocumentType.INVOICE,
    entityType: 'carrier' as const,
    entityId: 'carrier-1',
    clientId: 'client-1',
  },
});

const fakeDocument: Document = {
  id: 'doc-1',
  organizationId: 'org-1',
  entityType: 'carrier',
  entityId: 'carrier-1',
  type: DocumentType.INVOICE,
  fileName: 'invoice.pdf',
  fileSize: 5,
  mimeType: 'application/pdf',
  url: 'https://example.com/invoice.pdf',
  uploadStatus: 'completed',
  isArchived: false,
  notes: null,
  expiresAt: null,
  metadata: null,
  createdAt: '2026-05-25T00:00:00.000Z',
};

describe('uploadDocumentSaga (dispatcher)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads via helper and dispatches addOne + success + notify on happy path', async () => {
    presignDocumentMock.mockResolvedValue({
      presign: { documentId: 'doc-1', presignedUrl: 'https://s3/put' },
    });
    uploadDocumentToS3Mock.mockResolvedValue(undefined);
    confirmDocumentMock.mockResolvedValue({ document: fakeDocument });

    await expectSaga(uploadDocumentSaga, buildAction())
      .put(documentActions.addOne(fakeDocument))
      .put(uploadDocumentSuccess({ clientId: 'client-1' }))
      .put.like({
        action: {
          type: 'notification/notify',
          payload: { message: 'Document uploaded', variant: 'success' },
        },
      })
      .run();
  });

  it('dispatches uploadDocumentFailure + notify on error', async () => {
    presignDocumentMock.mockRejectedValue(new Error('boom'));

    await expectSaga(uploadDocumentSaga, buildAction())
      .put(uploadDocumentFailure({ clientId: 'client-1', error: 'boom' }))
      .put.like({
        action: {
          type: 'notification/notify',
          payload: { message: 'boom', variant: 'error' },
        },
      })
      .run();
  });
});
