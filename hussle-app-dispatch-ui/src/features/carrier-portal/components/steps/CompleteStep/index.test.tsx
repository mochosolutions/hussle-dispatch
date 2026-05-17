import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import type { Session, Step } from '../../../engine';
import type { LoadingStatus } from '../../../store/reducers/carrierPortalSlice';
import CompleteStep from '.';

const completeStep: Step = {
  id: 'complete',
  type: 'complete',
};

const buildSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'complete',
  completedStepIds: ['company-confirm', 'equipment-entry'],
  answers: {
    'company-authority-question': { hasMcAuthority: 'yes' },
    'company-confirm': { signatoryName: 'Jane Doe', legalName: 'Acme Trucking LLC' },
    'equipment-entry': { fleetSize: 3 },
  },
  invitation: {
    email: 'carrier@example.com',
    dispatcher: { firstName: 'Sam', lastName: 'Rivers' },
  },
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
      // No-op.
    },
  );
  const pages = combineReducers({ carrierPortalV2 });
  return configureStore({ reducer: { pages } });
};

describe('CompleteStep', () => {
  it('renders the headline using the first name from company-confirm signatoryName', () => {
    const store = buildStore(buildSession());

    render(
      <Provider store={store}>
        <CompleteStep step={completeStep} />
      </Provider>,
    );

    expect(screen.getByText(/You're submitted, Jane\./i)).toBeInTheDocument();
  });

  it('renders the dispatcher name from session.invitation.dispatcher', () => {
    const store = buildStore(buildSession());

    render(
      <Provider store={store}>
        <CompleteStep step={completeStep} />
      </Provider>,
    );

    expect(screen.getByText(/Sam Rivers will review your application/i)).toBeInTheDocument();
  });

  it('renders one summary row per completedStepId, using each schema step title or completeSummary', () => {
    const store = buildStore(buildSession());

    render(
      <Provider store={store}>
        <CompleteStep step={completeStep} />
      </Provider>,
    );

    expect(screen.getByText('WHAT YOU COMPLETED')).toBeInTheDocument();
    // company-confirm title from companyPhase: "Confirm your company details"
    expect(screen.getByText('Confirm your company details')).toBeInTheDocument();
    // equipment-entry title: "Tell us about your vehicles"
    expect(screen.getByText('Tell us about your vehicles')).toBeInTheDocument();
  });

  it('falls back to "there" when no signatoryName and "Your dispatcher" when no dispatcher', () => {
    const store = buildStore(
      buildSession({
        answers: {},
        invitation: { email: 'carrier@example.com' },
      }),
    );

    render(
      <Provider store={store}>
        <CompleteStep step={completeStep} />
      </Provider>,
    );

    expect(screen.getByText(/You're submitted, there\./i)).toBeInTheDocument();
    expect(screen.getByText(/Your dispatcher will review/i)).toBeInTheDocument();
  });
});
