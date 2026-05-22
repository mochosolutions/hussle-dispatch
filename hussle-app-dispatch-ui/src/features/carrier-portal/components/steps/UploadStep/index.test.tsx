import { combineReducers, configureStore, createReducer, createAction } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, render, screen } from '@testing-library/react';

import type { Session, Step } from '../../../engine';
import {
  carrierPortalV2Actions,
  type LoadingStatus,
} from '../../../store/reducers/carrierPortalSlice';
import UploadStep from '.';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const uploadStep: Step = {
  id: 'documents-upload',
  type: 'upload',
  title: 'Upload your documents',
  subtitle: 'Upload your Certificate of Insurance to complete onboarding.',
  documents: [
    {
      id: 'coi',
      label: 'Certificate of Insurance',
      required: true,
      documentType: 'INSURANCE_CERT',
    },
  ],
};

const baseSession: Session = {
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'documents-upload',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'carrier@example.com' },
};

interface SliceState {
  token: string | null;
  session: Session | null;
  loading: Record<string, LoadingStatus>;
  errors: Record<string, string>;
  lastSavedAt: string | null;
}

const setUploadStatus = createAction<LoadingStatus>('test/setUploadStatus');

const buildStore = (uploadStatus: LoadingStatus = 'idle') => {
  const carrierPortalV2 = createReducer<SliceState>(
    {
      token: null,
      session: baseSession,
      loading: { upload: uploadStatus },
      errors: {},
      lastSavedAt: null,
    },
    (builder) => {
      builder.addCase(setUploadStatus, (state, action) => {
        state.loading.upload = action.payload;
      });
    },
  );
  const pages = combineReducers({ carrierPortalV2 });
  return configureStore({ reducer: { pages } });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UploadStep', () => {
  it('renders one UploadZone per step.documents[] entry', () => {
    const store = buildStore();

    render(
      <Provider store={store}>
        <UploadStep step={uploadStep} />
      </Provider>,
    );

    expect(screen.getByText('Certificate of Insurance')).toBeInTheDocument();
    expect(screen.getByLabelText(/upload certificate of insurance/i)).toBeInTheDocument();
  });

  it('dispatches uploadDocument when a file is selected', () => {
    const store = buildStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <UploadStep step={uploadStep} />
      </Provider>,
    );

    const input = screen.getByLabelText(/upload certificate of insurance/i) as HTMLInputElement;
    const file = new File(['hello'], 'coi.pdf', { type: 'application/pdf' });

    act(() => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const uploadCall = dispatchSpy.mock.calls.find(
      ([action]) => carrierPortalV2Actions.uploadDocument.match(action),
    );
    expect(uploadCall).toBeDefined();
    const action = uploadCall?.[0] as ReturnType<typeof carrierPortalV2Actions.uploadDocument>;
    expect(action.payload.documentType).toBe('INSURANCE_CERT');
    expect(action.payload.file).toBe(file);
  });

  it('dispatches submitStep advance once all required documents are uploaded', () => {
    const store = buildStore('idle');
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <UploadStep step={uploadStep} />
      </Provider>,
    );

    // 1. User picks a file → state transitions 'idle' → 'pending' on the slice
    //    after the component dispatches uploadDocument. Our test reducer
    //    doesn't react to uploadDocument, so drive the transition manually.
    const input = screen.getByLabelText(/upload certificate of insurance/i) as HTMLInputElement;
    const file = new File(['hello'], 'coi.pdf', { type: 'application/pdf' });
    act(() => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    act(() => {
      store.dispatch(setUploadStatus('pending'));
    });

    // 2. Saga reports success → slice flips to 'success'. Component effect
    //    marks slot 'uploaded' and dispatches submitStep advance.
    act(() => {
      store.dispatch(setUploadStatus('success'));
    });

    const submitCall = dispatchSpy.mock.calls.find(
      ([action]) => carrierPortalV2Actions.submitStep.match(action),
    );
    expect(submitCall).toBeDefined();
    const submitAction = submitCall?.[0] as ReturnType<typeof carrierPortalV2Actions.submitStep>;
    expect(submitAction.payload.stepId).toBe('documents-upload');
    expect(submitAction.payload.answers).toEqual({ documentsCompleted: true });

    // Auto-advance must fire only once even if state churns.
    act(() => {
      store.dispatch(setUploadStatus('success'));
    });
    const submitCalls = dispatchSpy.mock.calls.filter(
      ([action]) => carrierPortalV2Actions.submitStep.match(action),
    );
    expect(submitCalls).toHaveLength(1);
  });
});
