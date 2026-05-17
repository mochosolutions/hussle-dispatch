import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Session, Step } from '../../../engine';
import {
  carrierPortalV2Actions,
  type LoadingStatus,
} from '../../../store/reducers/carrierPortalSlice';
import VerificationStep from '.';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const verificationStep: Step = {
  id: 'fmcsa-verification',
  type: 'verification',
  title: 'FMCSA verification',
};

const baseSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'fmcsa-verification',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'carrier@example.com' },
  ...overrides,
});

const buildStore = (session: Session | null) => {
  const carrierPortalV2 = createReducer(
    {
      token: null as string | null,
      session,
      loading: {} as Record<string, LoadingStatus>,
      errors: {} as Record<string, string>,
      lastSavedAt: null as string | null,
    },
    () => {
      // Tests assert via dispatch spy; reducer is a no-op.
    },
  );
  const pages = combineReducers({ carrierPortalV2 });
  return configureStore({ reducer: { pages } });
};

const renderStep = (session: Session | null) => {
  const store = buildStore(session);
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <VerificationStep step={verificationStep} />
    </Provider>,
  );
  return { store, dispatchSpy };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VerificationStep', () => {
  it('renders the loading state when fmcsaSnapshot is undefined', () => {
    renderStep(baseSession());

    expect(screen.getByText(/looking up your authority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loading fmcsa results/i)).toBeInTheDocument();
  });

  it('auto-advances on mount via submitStep when fmcsaSnapshot has a legalName', () => {
    const { dispatchSpy } = renderStep(
      baseSession({ fmcsaSnapshot: { legalName: 'Acme Trucking LLC' } }),
    );

    expect(screen.getByText(/found acme trucking llc, advancing/i)).toBeInTheDocument();

    const submitCall = dispatchSpy.mock.calls.find(([action]) =>
      carrierPortalV2Actions.submitStep.match(action),
    );
    expect(submitCall).toBeDefined();
    const action = submitCall?.[0] as ReturnType<typeof carrierPortalV2Actions.submitStep>;
    expect(action.payload.stepId).toBe('fmcsa-verification');
    expect(action.payload.answers).toEqual({ acknowledged: true });
  });

  it('renders the not-found amber UI when fmcsaSnapshot is present but empty', () => {
    renderStep(baseSession({ fmcsaSnapshot: {} }));

    expect(
      screen.getByText(/couldn't find an authority matching that mc number/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try a different number/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue without fmcsa/i }),
    ).toBeInTheDocument();
  });

  it('renders the service-problem red UI when authorityStatus is SERVICE_UNAVAILABLE', () => {
    renderStep(
      baseSession({ fmcsaSnapshot: { authorityStatus: 'SERVICE_UNAVAILABLE' } }),
    );

    expect(screen.getByText(/couldn't reach fmcsa right now/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^retry$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /skip and enter manually/i }),
    ).toBeInTheDocument();
  });

  it('dispatches submitStep with skippedFmcsa payload when "Continue without FMCSA" is clicked', async () => {
    const user = userEvent.setup();
    const { dispatchSpy } = renderStep(baseSession({ fmcsaSnapshot: {} }));

    dispatchSpy.mockClear();

    await user.click(screen.getByRole('button', { name: /continue without fmcsa/i }));

    const submitCall = dispatchSpy.mock.calls.find(([action]) =>
      carrierPortalV2Actions.submitStep.match(action),
    );
    expect(submitCall).toBeDefined();
    const action = submitCall?.[0] as ReturnType<typeof carrierPortalV2Actions.submitStep>;
    expect(action.payload.stepId).toBe('fmcsa-verification');
    expect(action.payload.answers).toEqual({ skippedFmcsa: true });
  });
});
