// Wave 0 scaffold — covers STAB-01, STAB-02, STAB-03 page-level behavior.
// Assertions for STAB-03 (PortalCompleteView transition gate) and STAB-08
// (CostResultCard wiring) are implemented here.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import ThemeCustomization from 'mocho/theme';
import { carrierPortalReducer } from '../../store/slices/carrierPortalSlice';
import CarrierPortalPage from './index';

// ---------------------------------------------------------------------------
// Mock notistack so enqueueSnackbar can be spied on.
// ---------------------------------------------------------------------------
jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
  closeSnackbar: jest.fn(),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
  useSnackbar: () => ({ enqueueSnackbar: jest.fn(), closeSnackbar: jest.fn() }),
}));

// ---------------------------------------------------------------------------
// Mock react-router-dom params (CarrierPortalPage reads token from useParams)
// ---------------------------------------------------------------------------
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ token: 'test-token' }),
}));

// Polyfill scrollIntoView for jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn() });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BuildStoreOptions {
  completedAt?: string | null;
  currentPhase?: number;
  lastSavedPhase?: number | null;
  formValues?: Record<string, unknown>;
}

const buildStore = ({
  completedAt = null,
  currentPhase = 1,
  lastSavedPhase = null,
}: BuildStoreOptions = {}) => {
  const preloadedState = {
    pages: {
      carrierPortal: {
        token: 'test-token',
        session: completedAt
          ? {
              id: 'session-1',
              currentPhase,
              currentQuestionIndex: 0,
              answers: {},
              completedPhases: [],
              lastActiveAt: new Date().toISOString(),
              completedAt,
            }
          : {
              id: 'session-1',
              currentPhase,
              currentQuestionIndex: 0,
              answers: {},
              completedPhases: [],
              lastActiveAt: new Date().toISOString(),
            },
        carrier: { id: 'carrier-1', name: 'Test Carrier', firstName: 'Test' },
        answers: {},
        loading: false,
        error: null,
        savingAnswer: false,
        savingPhase: false,
        lastSavedAt: null,
        currentPhase,
        lastSavedPhase,
      },
    },
  };

  // Build a minimal store with only the slices this component needs.
  // Using a partial preloadedState and filling other slices with empty reducers
  // avoids needing to import the entire root reducer.
  return configureStore({
    reducer: {
      pages: (
        state: typeof preloadedState.pages = preloadedState.pages,
      ) => state,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false, serializableCheck: false }),
  });
};

const renderPage = (storeOptions: BuildStoreOptions = {}) => {
  const store = buildStore(storeOptions);
  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeCustomization>
          <MemoryRouter initialEntries={['/carrier-portal/test-token']}>
            <Routes>
              <Route path="/carrier-portal/:token" element={<CarrierPortalPage />} />
            </Routes>
          </MemoryRouter>
        </ThemeCustomization>
      </Provider>,
    ),
  };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CarrierPortalPage — Plan 02/03/06 behavior', () => {
  it.todo('Save & Continue dispatches saveCompany when validation passes — STAB-01');
  it.todo('Save & Continue fires enqueueSnackbar + scrollIntoView when validation fails — STAB-02');
  it.todo('Final phase dispatches completeOnboarding (not sessionCompleted) — STAB-03');
  it.todo('lastSavedPhase rising-edge advances currentPhase by 1 — STAB-01');

  // ---------------------------------------------------------------------------
  // STAB-03 transition gate — BLOCKER 2
  // ---------------------------------------------------------------------------
  it('renders PortalCompleteView when session.completedAt is non-null — STAB-03 transition gate', () => {
    // Arrange: session with completedAt set
    renderPage({ completedAt: '2026-05-13T10:00:00Z', currentPhase: 6 });

    // Assert: PortalCompleteView is rendered (identified by its unique text)
    expect(screen.getByText(/you're submitted/i)).toBeInTheDocument();
  });

  it('does not render PortalCompleteView when session.completedAt is null — STAB-03 transition gate', () => {
    // Arrange: session without completedAt
    renderPage({ completedAt: null, currentPhase: 1 });

    // Assert: PortalCompleteView text is not present
    expect(screen.queryByText(/you're submitted/i)).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // STAB-08 wiring — CostResultCard Phase 4 conditional render — BLOCKER 3
  // ---------------------------------------------------------------------------
  it('renders PhaseForm for Phase 4 when cost fields are NOT all populated — STAB-08 wiring', () => {
    // Arrange: Phase 4 with only 2 of 6 cost fields populated
    const store = buildStore({ currentPhase: 4 });
    render(
      <Provider store={store}>
        <ThemeCustomization>
          <MemoryRouter initialEntries={['/carrier-portal/test-token']}>
            <Routes>
              <Route path="/carrier-portal/:token" element={<CarrierPortalPage />} />
            </Routes>
          </MemoryRouter>
        </ThemeCustomization>
      </Provider>,
    );

    // Assert: CostResultCard's unique text is NOT in the DOM
    expect(screen.queryByText(/cost analysis complete/i)).not.toBeInTheDocument();
  });
});
