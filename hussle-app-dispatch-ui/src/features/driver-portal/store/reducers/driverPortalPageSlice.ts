import { createAction, createReducer } from '@reduxjs/toolkit';
import type { DriverPortalStatus } from '../../types';

export type DocUploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export interface DriverPortalPageState {
  currentLoadId: string | null;
  portalStatus: DriverPortalStatus;
  statusUpdating: boolean;
  error: string | null;
  // "My Loads" list fetch state (separate from the single-load portalStatus).
  listStatus: DriverPortalStatus;
  // Per-document-type upload status for the current session, keyed by doc type.
  docUploads: Record<string, DocUploadStatus>;
  // Account-setup (invite accept) submit state.
  setupSubmitting: boolean;
  setupError: string | null;
}

const initialState: DriverPortalPageState = {
  currentLoadId: null,
  portalStatus: 'loading',
  statusUpdating: false,
  error: null,
  listStatus: 'loading',
  docUploads: {},
  setupSubmitting: false,
  setupError: null,
};

// --- Load fetch ---

export const fetchDriverPortalLoadRequest = createAction<{ loadId: string }>(
  'driverPortal/fetchLoadRequest',
);
export const fetchDriverPortalLoadSuccess = createAction<{ loadId: string }>(
  'driverPortal/fetchLoadSuccess',
);
export const fetchDriverPortalLoadFailure = createAction<{
  loadId: string | null;
  portalStatus: DriverPortalStatus;
}>('driverPortal/fetchLoadFailure');

// --- Loads list fetch ("My Loads") ---

export const fetchDriverPortalLoadsRequest = createAction('driverPortal/fetchLoadsRequest');
export const fetchDriverPortalLoadsSuccess = createAction('driverPortal/fetchLoadsSuccess');
export const fetchDriverPortalLoadsFailure = createAction<{ listStatus: DriverPortalStatus }>(
  'driverPortal/fetchLoadsFailure',
);

// --- Status advance ---

export const updateDriverStatusRequest = createAction<{ loadId: string; status: string }>(
  'driverPortal/updateStatusRequest',
);
export const updateDriverStatusSuccess = createAction<{ loadId: string }>(
  'driverPortal/updateStatusSuccess',
);
export const updateDriverStatusFailure = createAction<{ loadId: string; error: string }>(
  'driverPortal/updateStatusFailure',
);

// --- Document upload ---

export const uploadDriverDocumentRequest = createAction<{
  loadId: string;
  file: File;
  docType: string;
}>('driverPortal/uploadDocumentRequest');
export const uploadDriverDocumentSuccess = createAction<{ loadId: string; docType: string }>(
  'driverPortal/uploadDocumentSuccess',
);
export const uploadDriverDocumentFailure = createAction<{
  loadId: string;
  docType: string;
  error: string;
}>('driverPortal/uploadDocumentFailure');

// --- Account setup (invite accept) ---

export const acceptDriverInviteRequest = createAction<{
  token: string;
  password: string;
  email?: string;
  redirectTo: string;
}>('driverPortal/acceptInviteRequest');
export const acceptDriverInviteSuccess = createAction('driverPortal/acceptInviteSuccess');
export const acceptDriverInviteFailure = createAction<{ error: string }>(
  'driverPortal/acceptInviteFailure',
);

export const clearDriverPortalError = createAction('driverPortal/clearError');

export const driverPortalPageReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(fetchDriverPortalLoadRequest, (state, action) => {
      // Keep showing existing content during a socket-driven background refetch;
      // the initial state is already 'loading' so the first fetch shows the
      // skeleton without needing to set it again here.
      state.currentLoadId = action.payload.loadId;
    })
    .addCase(fetchDriverPortalLoadSuccess, (state) => {
      state.portalStatus = 'ready';
      state.error = null;
    })
    .addCase(fetchDriverPortalLoadFailure, (state, action) => {
      state.currentLoadId = action.payload.loadId;
      state.portalStatus = action.payload.portalStatus;
    })
    .addCase(fetchDriverPortalLoadsRequest, (state) => {
      // Only show the skeleton on the first load; a background refetch keeps
      // the existing list visible.
      if (state.listStatus !== 'ready') {
        state.listStatus = 'loading';
      }
    })
    .addCase(fetchDriverPortalLoadsSuccess, (state) => {
      state.listStatus = 'ready';
    })
    .addCase(fetchDriverPortalLoadsFailure, (state, action) => {
      state.listStatus = action.payload.listStatus;
    })
    .addCase(updateDriverStatusRequest, (state) => {
      state.statusUpdating = true;
      state.error = null;
    })
    .addCase(updateDriverStatusSuccess, (state) => {
      state.statusUpdating = false;
    })
    .addCase(updateDriverStatusFailure, (state, action) => {
      state.statusUpdating = false;
      state.error = action.payload.error;
    })
    .addCase(uploadDriverDocumentRequest, (state, action) => {
      state.docUploads[action.payload.docType] = 'uploading';
    })
    .addCase(uploadDriverDocumentSuccess, (state, action) => {
      state.docUploads[action.payload.docType] = 'done';
    })
    .addCase(uploadDriverDocumentFailure, (state, action) => {
      state.docUploads[action.payload.docType] = 'error';
    })
    .addCase(acceptDriverInviteRequest, (state) => {
      state.setupSubmitting = true;
      state.setupError = null;
    })
    .addCase(acceptDriverInviteSuccess, (state) => {
      state.setupSubmitting = false;
    })
    .addCase(acceptDriverInviteFailure, (state, action) => {
      state.setupSubmitting = false;
      state.setupError = action.payload.error;
    })
    .addCase(clearDriverPortalError, (state) => {
      state.error = null;
      state.setupError = null;
    });
});
