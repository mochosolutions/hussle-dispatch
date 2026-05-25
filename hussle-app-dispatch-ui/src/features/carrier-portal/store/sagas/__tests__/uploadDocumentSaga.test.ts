// ---------------------------------------------------------------------------
// US-06 T-19 — Portal uploadDocumentSaga unit test.
//
// Covers:
//   - happy path: presign → PUT → confirm → uploadDocumentSuccess
//   - error path: presign throws → uploadDocumentFailure + error snackbar
// ---------------------------------------------------------------------------

import { expectSaga } from 'redux-saga-test-plan';
import { enqueueSnackbar } from 'notistack';

import type { Session } from 'features/carrier-portal/engine';
import { DocumentType } from 'features/documents/types';

import { uploadDocumentSaga } from '../uploadDocumentSaga';
import {
  carrierPortalV2Actions,
  carrierPortalV2Reducer,
} from '../../reducers/carrierPortalSlice';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

jest.mock('utils/api/carrierPortal/v2', () => ({
  presignDocumentV2: jest.fn(),
  confirmDocumentV2: jest.fn(),
  uploadToPresignedUrl: jest.fn(),
}));

import {
  presignDocumentV2,
  confirmDocumentV2,
  uploadToPresignedUrl,
} from 'utils/api/carrierPortal/v2';

const presignDocumentV2Mock = presignDocumentV2 as jest.MockedFunction<typeof presignDocumentV2>;
const confirmDocumentV2Mock = confirmDocumentV2 as jest.MockedFunction<typeof confirmDocumentV2>;
const uploadToPresignedUrlMock = uploadToPresignedUrl as jest.MockedFunction<
  typeof uploadToPresignedUrl
>;

const session: Session = {
  id: 'session-1',
  carrierId: 'carrier-1',
  currentStepId: 'documents',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'driver@example.com' },
  agreements: {},
};

const buildState = () => {
  const base = carrierPortalV2Reducer(undefined, { type: '@@INIT' });
  return {
    pages: {
      carrierPortalV2: {
        ...base,
        token: 'tok-123',
        session,
      },
    },
  };
};

const buildPayload = () => ({
  documentType: DocumentType.INSURANCE_CERT,
  file: new File(['hello'], 'coi.pdf', { type: 'application/pdf' }),
});

describe('portal uploadDocumentSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches uploadDocumentSuccess on happy path', () => {
    presignDocumentV2Mock.mockResolvedValue({
      documentId: 'doc-1',
      uploadUrl: 'https://s3/put',
      key: 'documents/doc-1',
    });
    uploadToPresignedUrlMock.mockResolvedValue(undefined);
    confirmDocumentV2Mock.mockResolvedValue({
      id: 'doc-1',
      documentType: DocumentType.INSURANCE_CERT,
    });

    return expectSaga(uploadDocumentSaga)
      .withState(buildState())
      .put(
        carrierPortalV2Actions.uploadDocumentSuccess({
          documentType: DocumentType.INSURANCE_CERT,
        }),
      )
      .dispatch(carrierPortalV2Actions.uploadDocument(buildPayload()))
      .silentRun();
  });

  it('dispatches uploadDocumentFailure + snackbar on error', () => {
    presignDocumentV2Mock.mockRejectedValue(new Error('network down'));

    return expectSaga(uploadDocumentSaga)
      .withState(buildState())
      .put(carrierPortalV2Actions.uploadDocumentFailure('network down'))
      .call(enqueueSnackbar, 'network down', { variant: 'error' })
      .dispatch(carrierPortalV2Actions.uploadDocument(buildPayload()))
      .silentRun();
  });
});
