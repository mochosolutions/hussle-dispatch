import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';

import type {
  AgreementContext,
  DocumentContext,
  DocumentSlot,
  Session,
  Step,
} from 'features/carrier-portal/engine';
import {
  carrierPortalV2Actions,
  type LoadingStatus,
} from '../../../store/reducers/carrierPortalSlice';
import {
  TestStepNavProvider,
  type StepNavTestHandle,
} from '../../StepNavContext';
import AgreementListView from './AgreementListView';

const COI_SLOT: DocumentSlot = {
  id: 'coi',
  label: 'Certificate of Insurance',
  required: true,
  documentType: 'INSURANCE_CERT',
};

const stepWithoutDocs: Step = { id: 'sign-agreement', type: 'signing' };
const stepWithCOI: Step = {
  id: 'sign-agreement',
  type: 'signing',
  documents: [COI_SLOT],
};

const buildSession = (
  agreements: Record<string, AgreementContext> | undefined,
  documents: DocumentContext[] = [],
): Session => ({
  id: 'sess-1',
  carrierId: 'carrier-1',
  currentStepId: 'sign-agreement',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'c@test.com', phone: null, organizationName: 'Acme' },
  agreements,
  documents,
});

const buildStore = (session: Session | null) => {
  const carrierPortalV2 = createReducer(
    {
      token: 'tok-abc' as string | null,
      session,
      loading: {} as Record<string, LoadingStatus>,
      errors: {} as Record<string, string>,
      lastSavedAt: null as string | null,
    },
    () => undefined,
  );
  const pages = combineReducers({ carrierPortalV2 });
  return configureStore({ reducer: { pages } });
};

const renderListView = (
  session: Session | null,
  step: Step,
  handle: StepNavTestHandle = { current: null },
) => {
  const store = buildStore(session);
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/carrier-portal/tok-abc/sign-agreement']}>
        <Routes>
          <Route
            path="/carrier-portal/:token/*"
            element={
              <TestStepNavProvider handle={handle}>
                <AgreementListView step={step} />
              </TestStepNavProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { ...utils, store, handle, dispatchSpy };
};

const pendingAgreement: AgreementContext = {
  id: 'agr-1',
  templateKey: 'DISPATCH_AGREEMENT',
  status: 'PENDING',
};

const signedAgreement: AgreementContext = {
  id: 'agr-1',
  templateKey: 'DISPATCH_AGREEMENT',
  status: 'SIGNED',
  signedAt: '2026-05-16T15:08:00Z',
};

const uploadedCOI: DocumentContext = {
  id: 'doc-1',
  documentType: 'INSURANCE_CERT',
  fileName: 'coi.pdf',
  fileUrl: 'https://example.com/coi.pdf',
  uploadedAt: '2026-05-16T15:00:00Z',
};

describe('AgreementListView', () => {
  describe('agreement-only mode (no documents on step)', () => {
    it('renders one row per visible agreement key', () => {
      renderListView(buildSession({ DISPATCH_AGREEMENT: pendingAgreement }), stepWithoutDocs);
      expect(
        screen.getByRole('button', { name: /sign dispatch services agreement/i }),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Dispatch Services Agreement/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows complete banner when all agreements signed and no docs required', () => {
      renderListView(buildSession({ DISPATCH_AGREEMENT: signedAgreement }), stepWithoutDocs);
      expect(screen.getByText(/All documents uploaded and agreements signed/)).toBeInTheDocument();
    });

    it('renders a red-bordered blocked treatment for VOIDED agreements', () => {
      renderListView(
        buildSession({
          DISPATCH_AGREEMENT: {
            id: 'agr-1',
            templateKey: 'DISPATCH_AGREEMENT',
            status: 'VOIDED',
          },
        }),
        stepWithoutDocs,
      );
      expect(screen.getByText(/Contact your dispatcher/)).toBeInTheDocument();
    });
  });

  describe('unified rows (docs + agreements)', () => {
    it('renders document row BEFORE agreement row in the DOM', () => {
      renderListView(buildSession({ DISPATCH_AGREEMENT: pendingAgreement }), stepWithCOI);

      const uploadButton = screen.getByRole('button', {
        name: /upload certificate of insurance/i,
      });
      const signButton = screen.getByRole('button', { name: /sign dispatch services agreement/i });

      const relation = uploadButton.compareDocumentPosition(signButton);
      expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('shows COI as next when no docs uploaded yet', () => {
      renderListView(buildSession({ DISPATCH_AGREEMENT: pendingAgreement }), stepWithCOI);
      // Upload button for COI
      expect(
        screen.getByRole('button', { name: /upload certificate of insurance/i }),
      ).toBeInTheDocument();
    });

    it('shows uploaded badge when COI is in session.documents', () => {
      renderListView(
        buildSession({ DISPATCH_AGREEMENT: pendingAgreement }, [uploadedCOI]),
        stepWithCOI,
      );
      expect(screen.getByLabelText('Uploaded')).toBeInTheDocument();
    });

    it('blocks Continue when docs incomplete (agreements signed)', async () => {
      const handle: StepNavTestHandle = { current: null };
      const { dispatchSpy } = renderListView(
        buildSession({ DISPATCH_AGREEMENT: signedAgreement }, []),
        stepWithCOI,
        handle,
      );

      handle.current?.onContinue();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(
        /Please upload all required documents and sign all required agreements/,
      );
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: carrierPortalV2Actions.submitStep.type }),
      );
    });

    it('blocks Continue when agreements incomplete (docs uploaded)', async () => {
      const handle: StepNavTestHandle = { current: null };
      const { dispatchSpy } = renderListView(
        buildSession({ DISPATCH_AGREEMENT: pendingAgreement }, [uploadedCOI]),
        stepWithCOI,
        handle,
      );

      handle.current?.onContinue();

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: carrierPortalV2Actions.submitStep.type }),
      );
    });

    it('dispatches submitStep with uploadedDocumentTypes + signedAgreementIds when all complete', () => {
      const handle: StepNavTestHandle = { current: null };
      const { dispatchSpy } = renderListView(
        buildSession({ DISPATCH_AGREEMENT: signedAgreement }, [uploadedCOI]),
        stepWithCOI,
        handle,
      );

      handle.current?.onContinue();

      expect(dispatchSpy).toHaveBeenCalledWith(
        carrierPortalV2Actions.submitStep({
          stepId: 'sign-agreement',
          answers: {
            acknowledged: true,
            uploadedDocumentTypes: ['INSURANCE_CERT'],
            signedAgreementIds: ['agr-1'],
          },
        }),
      );
    });

    it('reports total complete count across both documents and agreements', () => {
      renderListView(
        buildSession({ DISPATCH_AGREEMENT: signedAgreement }, [uploadedCOI]),
        stepWithCOI,
      );
      // "X of Y required complete" appears in both the complete banner and
      // the ProgressStrip when allComplete — getAllByText asserts at least
      // one occurrence, which is the actual contract.
      expect(screen.getAllByText(/2 of 2 required complete/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows AgreementsErrorBanner when Continue is invoked with unsigned remaining (no docs)', async () => {
    const handle: StepNavTestHandle = { current: null };
    renderListView(
      buildSession({ DISPATCH_AGREEMENT: pendingAgreement }),
      stepWithoutDocs,
      handle,
    );

    handle.current?.onContinue();
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/Please upload all required documents/)).toBeInTheDocument();
  });
});
