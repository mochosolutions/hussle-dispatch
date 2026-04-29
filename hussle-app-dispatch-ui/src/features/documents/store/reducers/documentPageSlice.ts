import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DocumentEntityType, DocumentType } from '../../types';

// ---------------------------------------------------------------------------
// Custom actions for document operations that don't fit the standard CRUD pattern
// ---------------------------------------------------------------------------

interface UploadDocumentPayload {
  file: File;
  documentType: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
  clientId: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

interface BulkDownloadPayload {
  documentIds: string[];
}

interface FetchDocumentsPayload {
  entityType: DocumentEntityType;
  entityId: string;
}

interface DocumentPageState {
  loading: Record<string, string>;
  errors: Record<string, string>;
}

const initialState: DocumentPageState = {
  loading: {},
  errors: {},
};

const documentPageSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    fetchDocumentsRequest(state, action: PayloadAction<FetchDocumentsPayload>) {
      const key = `fetch:${action.payload.entityType}:${action.payload.entityId}`;
      state.loading[key] = 'Pending';
      state.errors[key] = '';
    },
    fetchDocumentsSuccess(state, action: PayloadAction<FetchDocumentsPayload>) {
      const key = `fetch:${action.payload.entityType}:${action.payload.entityId}`;
      state.loading[key] = 'Fulfilled';
    },
    fetchDocumentsFailure(
      state,
      action: PayloadAction<FetchDocumentsPayload & { error: string }>,
    ) {
      const key = `fetch:${action.payload.entityType}:${action.payload.entityId}`;
      state.loading[key] = 'Rejected';
      state.errors[key] = action.payload.error;
    },

    uploadDocumentRequest(state, action: PayloadAction<UploadDocumentPayload>) {
      const key = `upload:${action.payload.clientId}`;
      state.loading[key] = 'Pending';
      state.errors[key] = '';
    },
    uploadDocumentSuccess(state, action: PayloadAction<{ clientId: string }>) {
      const key = `upload:${action.payload.clientId}`;
      state.loading[key] = 'Fulfilled';
    },
    uploadDocumentFailure(
      state,
      action: PayloadAction<{ clientId: string; error: string }>,
    ) {
      const key = `upload:${action.payload.clientId}`;
      state.loading[key] = 'Rejected';
      state.errors[key] = action.payload.error;
    },

    bulkDownloadRequest(state, action: PayloadAction<BulkDownloadPayload>) {
      state.loading['bulkDownload'] = 'Pending';
      state.errors['bulkDownload'] = '';
      // payload consumed by saga
      void action.payload;
    },
    bulkDownloadSuccess(state) {
      state.loading['bulkDownload'] = 'Fulfilled';
    },
    bulkDownloadFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading['bulkDownload'] = 'Rejected';
      state.errors['bulkDownload'] = action.payload.error;
    },

    clearUploadStatus(state, action: PayloadAction<{ clientId: string }>) {
      const key = `upload:${action.payload.clientId}`;
      state.loading[key] = 'Idle';
      state.errors[key] = '';
    },

    archiveDocumentRequest(state, action: PayloadAction<{ documentId: string }>) {
      const key = `archive:${action.payload.documentId}`;
      state.loading[key] = 'Pending';
      state.errors[key] = '';
    },
    archiveDocumentSuccess(state, action: PayloadAction<{ documentId: string }>) {
      const key = `archive:${action.payload.documentId}`;
      state.loading[key] = 'Fulfilled';
    },
    archiveDocumentFailure(
      state,
      action: PayloadAction<{ documentId: string; error: string }>,
    ) {
      const key = `archive:${action.payload.documentId}`;
      state.loading[key] = 'Rejected';
      state.errors[key] = action.payload.error;
    },

  },
});

export const {
  fetchDocumentsRequest,
  fetchDocumentsSuccess,
  fetchDocumentsFailure,
  uploadDocumentRequest,
  uploadDocumentSuccess,
  uploadDocumentFailure,
  bulkDownloadRequest,
  bulkDownloadSuccess,
  bulkDownloadFailure,
  clearUploadStatus,
  archiveDocumentRequest,
  archiveDocumentSuccess,
  archiveDocumentFailure,
} = documentPageSlice.actions;

export default documentPageSlice.reducer;
