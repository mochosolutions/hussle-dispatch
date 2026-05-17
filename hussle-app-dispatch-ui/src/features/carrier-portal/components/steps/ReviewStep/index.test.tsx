import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Session, Step } from '../../../engine';
import {
  carrierPortalV2Actions,
  type LoadingStatus,
} from '../../../store/reducers/carrierPortalSlice';
import ReviewStep from '.';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const reviewStep: Step = {
  id: 'review',
  type: 'review',
  title: 'Review your answers',
};

const buildSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'review',
  // Use real schema step ids so getVisibleSteps includes them.
  completedStepIds: ['company-confirm', 'equipment-entry'],
  answers: {
    'company-authority-question': { hasMcAuthority: 'yes' },
    'company-confirm': { legalName: 'Acme Trucking LLC', signatoryName: 'Jane Doe' },
    'equipment-entry': { fleetSize: 3 },
  },
  invitation: { email: 'carrier@example.com' },
  ...overrides,
});

interface BuildStoreOptions {
  session?: Session;
  isLocked?: boolean;
}

const buildStore = ({ session = buildSession(), isLocked = false }: BuildStoreOptions = {}) => {
  const sessionWithLock: Session = isLocked
    ? { ...session, agreement: { id: 'agr-1', status: 'SIGNED', signedFieldsLocked: true } }
    : session;

  const carrierPortalV2 = createReducer(
    {
      token: null as string | null,
      session: sessionWithLock as Session | null,
      loading: {} as Record<string, LoadingStatus>,
      errors: {} as Record<string, string>,
      lastSavedAt: null as string | null,
    },
    () => {
      // No-op: tests assert dispatched actions via spy.
    },
  );
  const pages = combineReducers({ carrierPortalV2 });
  return configureStore({ reducer: { pages } });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReviewStep', () => {
  it('renders a row for each completed step', () => {
    const store = buildStore();

    render(
      <Provider store={store}>
        <ReviewStep step={reviewStep} />
      </Provider>,
    );

    expect(screen.getByText('Acme Trucking LLC')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('dispatches navigateToStep when Edit is clicked', async () => {
    const user = userEvent.setup();
    const store = buildStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ReviewStep step={reviewStep} />
      </Provider>,
    );

    const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
    await user.click(editButtons[0]);

    const navCall = dispatchSpy.mock.calls.find(
      ([action]) => carrierPortalV2Actions.navigateToStep.match(action),
    );
    expect(navCall).toBeDefined();
    const action = navCall?.[0] as ReturnType<typeof carrierPortalV2Actions.navigateToStep>;
    expect(typeof action.payload.stepId).toBe('string');
  });

  it('disables Edit for company-phase steps when the session is locked', () => {
    const store = buildStore({ isLocked: true });

    render(
      <Provider store={store}>
        <ReviewStep step={reviewStep} />
      </Provider>,
    );

    // The company-confirm row's Edit button should be disabled (aria-label = "Edit locked").
    const lockedButton = screen.getByRole('button', { name: /edit locked/i });
    expect(lockedButton).toBeDisabled();

    // Non-company-phase step (equipment) still has an enabled Edit.
    const enabledEdits = screen
      .getAllByRole('button', { name: /^edit$/i })
      .filter((b) => !(b as HTMLButtonElement).disabled);
    expect(enabledEdits.length).toBeGreaterThanOrEqual(1);
  });
});
