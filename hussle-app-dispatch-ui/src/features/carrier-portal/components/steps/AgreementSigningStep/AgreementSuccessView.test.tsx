import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AgreementContext, Session } from 'features/carrier-portal/engine';
import { type LoadingStatus } from '../../../store/reducers/carrierPortalSlice';
import { TestStepChromeProvider } from '../../StepNavContext';
import AgreementSuccessView from './AgreementSuccessView';

const buildSession = (agreements: Record<string, AgreementContext>): Session => ({
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

const renderSuccessView = (
  agreementKey: string,
  session: Session,
) => {
  const store = buildStore(session);
  const utils = render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[`/carrier-portal/tok-abc/sign-agreement/${agreementKey}/signed`]}
      >
        <TestStepChromeProvider>
          <Routes>
            <Route
              path="/carrier-portal/:token/sign-agreement/:key/signed"
              element={<AgreementSuccessView agreementKey={agreementKey} />}
            />
            <Route
              path="/carrier-portal/:token/sign-agreement"
              element={<div data-testid="list-view" />}
            />
            <Route
              path="/carrier-portal/:token/sign-agreement/:key"
              element={<div data-testid="focus-view" />}
            />
          </Routes>
        </TestStepChromeProvider>
      </MemoryRouter>
    </Provider>,
  );
  return { ...utils, store };
};

describe('AgreementSuccessView', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renders the signed timestamp', () => {
    renderSuccessView(
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
    expect(screen.getByText('Signed')).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('no auto-advance + no "Up next" when on the final agreement', () => {
    renderSuccessView(
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

    expect(screen.queryByText(/Up next/i)).not.toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // Back-to-list button is always present.
    expect(screen.getByRole('button', { name: /back to list/i })).toBeInTheDocument();
  });

  it('navigates back to list when back-to-list button clicked', async () => {
    jest.useRealTimers();
    renderSuccessView(
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
    await userEvent.click(screen.getByRole('button', { name: /back to list/i }));
    expect(await screen.findByTestId('list-view')).toBeInTheDocument();
  });
});
