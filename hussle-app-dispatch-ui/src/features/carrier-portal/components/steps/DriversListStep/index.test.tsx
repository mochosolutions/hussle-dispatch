import { act } from 'react';
import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  carrierPortalV2Actions,
  carrierPortalV2Reducer,
} from '../../../store/reducers/carrierPortalSlice';
import type { Session, Step } from '../../../engine';
import { driversPhase } from '../../../schema/driversPhase';
import {
  TestStepNavProvider,
  type StepNavTestHandle,
} from '../../StepNavContext';
import DriversListStep from '.';

const driversListStep: Step | undefined = driversPhase.steps.find(
  (s) => s.id === 'drivers-list',
);
if (!driversListStep) {
  throw new Error('drivers-list step is missing from driversPhase');
}

const buildSession = (): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'drivers-list',
  completedStepIds: [],
  answers: {},
  invitation: {
    email: 'carrier@example.com',
    organizationName: null,
  },
});

interface BuildStoreOptions {
  session: Session | null;
}

const buildStore = ({ session }: BuildStoreOptions) => {
  const carrierPortalV2 = createReducer(
    {
      token: null as string | null,
      session,
      loading: {} as Record<string, 'idle' | 'pending' | 'success' | 'failure'>,
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

void carrierPortalV2Reducer;

describe('DriversListStep (connected)', () => {
  it('renders the empty state when no drivers have been added', () => {
    const store = buildStore({ session: buildSession() });

    render(
      <Provider store={store}>
        <DriversListStep step={driversListStep} />
      </Provider>,
    );

    expect(screen.getByText('No drivers added')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add your first driver/i }),
    ).toBeInTheDocument();
  });

  it('opens the inline form when "Add your first driver" is clicked', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: buildSession() });

    render(
      <Provider store={store}>
        <DriversListStep step={driversListStep} />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /add your first driver/i }));

    expect(screen.getByText('Add a driver')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save driver$/i })).toBeInTheDocument();
  });

  it('dispatches submitStep with an entries array after a driver is saved and Continue is clicked', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: buildSession() });
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <DriversListStep step={driversListStep} />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /add your first driver/i }));

    await user.type(screen.getByLabelText(/first name/i), 'Isaiah');
    await user.type(screen.getByLabelText(/last name/i), 'Williams');
    const phoneInput = document.querySelector('input[name="phone"]');
    if (!(phoneInput instanceof HTMLInputElement)) {
      throw new Error('phone input not found');
    }
    await user.type(phoneInput, '7045551234');
    await user.type(screen.getByLabelText(/email/i), 'isaiah@example.com');
    await user.type(screen.getByLabelText(/pay rate/i), '70');

    await user.click(screen.getByRole('button', { name: /save driver$/i }));

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toBeDisabled();

    await user.click(continueButton);

    const submitCalls = dispatchSpy.mock.calls.filter(
      ([action]) =>
        typeof action === 'object' &&
        action !== null &&
        'type' in action &&
        action.type === carrierPortalV2Actions.submitStep.type,
    );
    expect(submitCalls).toHaveLength(1);
    const submitArg = submitCalls[0]?.[0] as ReturnType<
      typeof carrierPortalV2Actions.submitStep
    >;
    expect(submitArg.payload.stepId).toBe('drivers-list');
    const entries = (submitArg.payload.answers as { entries: unknown[] }).entries;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      firstName: 'Isaiah',
      lastName: 'Williams',
      email: 'isaiah@example.com',
      payType: 'percentage',
      payRate: '70',
    });
  });

  it('disables Continue when no drivers have been saved', () => {
    const store = buildStore({ session: buildSession() });

    render(
      <Provider store={store}>
        <DriversListStep step={driversListStep} />
      </Provider>,
    );

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });
});
