import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AgreementContext, Session } from 'features/carrier-portal/engine';
import {
  carrierPortalV2Actions,
  type LoadingStatus,
} from '../../../store/reducers/carrierPortalSlice';
import { TestStepChromeProvider } from '../../StepNavContext';
import AgreementFocusView from './AgreementFocusView';

const buildSession = (
  agreements: Record<string, AgreementContext>,
): Session => ({
  id: 'sess-1',
  carrierId: 'carrier-1',
  currentStepId: 'sign-agreement',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'c@test.com', phone: null, organizationName: 'Acme' },
  agreements,
});

const buildStore = (session: Session) => {
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

const renderFocusView = (
  agreementKey: string,
  session: Session,
  initialPath = `/carrier-portal/tok-abc/sign-agreement/${agreementKey}`,
) => {
  const store = buildStore(session);
  // Spy BEFORE render so useDispatch captures the spy.
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <TestStepChromeProvider>
          <Routes>
            <Route
              path="/carrier-portal/:token/sign-agreement/:key"
              element={<AgreementFocusView agreementKey={agreementKey} />}
            />
            <Route
              path="/carrier-portal/:token/sign-agreement"
              element={<div data-testid="list-view" />}
            />
            <Route
              path="/carrier-portal/:token/sign-agreement/:key/signed"
              element={<div data-testid="success-view" />}
            />
          </Routes>
        </TestStepChromeProvider>
      </MemoryRouter>
    </Provider>,
  );
  return { ...utils, store, dispatchSpy };
};

describe('AgreementFocusView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the iframe when mock=false and status=PENDING', () => {
    renderFocusView(
      'DISPATCH_AGREEMENT',
      buildSession({
        DISPATCH_AGREEMENT: {
          id: 'agr-1',
          templateKey: 'DISPATCH_AGREEMENT',
          status: 'PENDING',
          embedUrl: 'http://localhost:3030/s/abc',
          mock: false,
        },
      }),
    );
    const iframe = screen.getByTitle(/Dispatch Services Agreement/);
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toBe('/docuseal-embed/s/abc');
  });

  it('renders MockSigningPlaceholder when mock=true', () => {
    renderFocusView(
      'DISPATCH_AGREEMENT',
      buildSession({
        DISPATCH_AGREEMENT: {
          id: 'agr-1',
          templateKey: 'DISPATCH_AGREEMENT',
          status: 'PENDING',
          embedUrl: null,
          mock: true,
        },
      }),
    );
    expect(screen.getAllByText('Mock mode').length).toBeGreaterThan(0);
    expect(screen.queryByTitle(/Dispatch Services Agreement/)).not.toBeInTheDocument();
  });

  it('renders one AgreementPrefillSummary row per variables entry', () => {
    renderFocusView(
      'DISPATCH_AGREEMENT',
      buildSession({
        DISPATCH_AGREEMENT: {
          id: 'agr-1',
          templateKey: 'DISPATCH_AGREEMENT',
          status: 'PENDING',
          embedUrl: 'http://localhost:3030/s/abc',
          mock: false,
          variables: {
            carrier_legal_name: 'Acme Trucking LLC',
            mc_number: 'MC123456',
          },
        },
      }),
    );
    expect(screen.getAllByText('Carrier Legal Name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acme Trucking LLC').length).toBeGreaterThan(0);
  });

  it('renders inline error when sign-complete clicked with status !== SIGNED', async () => {
    jest.useRealTimers();
    renderFocusView(
      'DISPATCH_AGREEMENT',
      buildSession({
        DISPATCH_AGREEMENT: {
          id: 'agr-1',
          templateKey: 'DISPATCH_AGREEMENT',
          status: 'PENDING',
          embedUrl: 'http://localhost:3030/s/abc',
          mock: false,
        },
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: /sign & continue to next/i }));
    expect(screen.getByText(/please complete signing/i)).toBeInTheDocument();
    expect(screen.queryByTestId('success-view')).not.toBeInTheDocument();
  });

  it('navigates to success URL when sign-complete clicked with status === SIGNED', async () => {
    jest.useRealTimers();
    renderFocusView(
      'DISPATCH_AGREEMENT',
      buildSession({
        DISPATCH_AGREEMENT: {
          id: 'agr-1',
          templateKey: 'DISPATCH_AGREEMENT',
          status: 'SIGNED',
          signedAt: '2026-05-16T15:08:00Z',
        },
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: /sign & continue to next/i }));
    expect(await screen.findByTestId('success-view')).toBeInTheDocument();
  });

  it('navigates back to list when Cancel (FocusFooter save-close) clicked', async () => {
    jest.useRealTimers();
    renderFocusView(
      'DISPATCH_AGREEMENT',
      buildSession({
        DISPATCH_AGREEMENT: {
          id: 'agr-1',
          templateKey: 'DISPATCH_AGREEMENT',
          status: 'PENDING',
          embedUrl: 'http://localhost:3030/s/abc',
        },
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(await screen.findByTestId('list-view')).toBeInTheDocument();
  });

  it('polls fetchAgreements every 4s while any visible agreement is PENDING', () => {
    const session = buildSession({
      DISPATCH_AGREEMENT: {
        id: 'agr-1',
        templateKey: 'DISPATCH_AGREEMENT',
        status: 'PENDING',
        embedUrl: 'http://localhost:3030/s/abc',
      },
    });
    const { dispatchSpy } = renderFocusView('DISPATCH_AGREEMENT', session);

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.fetchAgreements({ templateKeys: ['DISPATCH_AGREEMENT'] }),
    );
  });

  it('dispatches markAgreementSignedMock when MockSigningPlaceholder button clicked', async () => {
    jest.useRealTimers();
    const session = buildSession({
      DISPATCH_AGREEMENT: {
        id: 'agr-1',
        templateKey: 'DISPATCH_AGREEMENT',
        status: 'PENDING',
        embedUrl: null,
        mock: true,
      },
    });
    const { dispatchSpy } = renderFocusView('DISPATCH_AGREEMENT', session);

    await userEvent.click(screen.getByRole('button', { name: /mark as signed/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.markAgreementSignedMock({ agreementId: 'agr-1' }),
    );
  });
});
