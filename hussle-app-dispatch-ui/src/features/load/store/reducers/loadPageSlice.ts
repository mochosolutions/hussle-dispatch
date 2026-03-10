import { createAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';
import type { BoardView, LoadFilters, LoadStatus, TransitionStatusInput } from '../../types';

export const loadPageSlice = createCrudSlice({
  name: 'load',
  entityName: 'load',
  entityNamePlural: 'loads',
});

export const loadPageSelectors = createCrudSelectors<RootState>((state) => state.pages.loads);

// Semantic action aliases — match the naming convention used by sagas and barrel exports
export const {
  fetchAllRequest: fetchLoadsRequest,
  fetchAllSuccess: fetchLoadsSuccess,
  fetchAllFailure: fetchLoadsFailure,
  fetchByIdRequest: fetchLoadDetailsRequest,
  fetchByIdSuccess: fetchLoadDetailsSuccess,
  fetchByIdFailure: fetchLoadDetailsFailure,
  createRequest: createLoadRequest,
  createSuccess: createLoadSuccess,
  createFailure: createLoadFailure,
  updateRequest: updateLoadRequest,
  updateSuccess: updateLoadSuccess,
  updateFailure: updateLoadFailure,
  deleteRequest: deleteLoadRequest,
  deleteSuccess: deleteLoadSuccess,
  deleteFailure: deleteLoadFailure,
} = loadPageSlice.actions;

// ---------------------------------------------------------------------------
// Custom actions for load-specific features
// ---------------------------------------------------------------------------

export const setBoardView = createAction<BoardView>('load/setBoardView');

export const setLoadFilters = createAction<LoadFilters>('load/setLoadFilters');

export const transitionLoadStatusRequest = createAction<{
  loadId: string;
  input: TransitionStatusInput;
}>('load/transitionLoadStatusRequest');

export const transitionLoadStatusSuccess = createAction<{
  loadId: string;
  newStatus: LoadStatus;
}>('load/transitionLoadStatusSuccess');

export const transitionLoadStatusFailure = createAction<{
  loadId: string;
  error: string;
}>('load/transitionLoadStatusFailure');

export const showTransitionWarnings = createAction<{
  loadId: string;
  warnings: { code: string; message: string; detail?: string }[];
}>('load/showTransitionWarnings');

export const createCheckCallRequest = createAction<{
  loadId: string;
  data: {
    location?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    eta?: string;
    notes?: string;
    brokerNotified: boolean;
    brokerNotes?: string;
  };
}>('load/createCheckCallRequest');

export const createCheckCallSuccess = createAction<{
  loadId: string;
}>('load/createCheckCallSuccess');

export const createCheckCallFailure = createAction<{
  loadId: string;
  error: string;
}>('load/createCheckCallFailure');
