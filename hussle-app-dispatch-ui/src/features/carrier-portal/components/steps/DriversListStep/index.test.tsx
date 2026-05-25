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
import { TestStepNavProvider, type StepNavTestHandle } from '../../StepNavContext';
import DriversListStep from '.';

void ({} as Step);

const driversListStep: Step | undefined = driversPhase.steps.find((s) => s.id === 'drivers-list');
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
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <DriversListStep step={driversListStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(screen.getByText('No drivers added')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add your first driver/i })).toBeInTheDocument();
  });

  it('opens the inline form when "Add your first driver" is clicked', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: buildSession() });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <DriversListStep step={driversListStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /add your first driver/i }));

    expect(screen.getByText('Add a driver')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save driver$/i })).toBeInTheDocument();
  });

  it('dispatches saveDrivers with a drivers array after a driver is saved and registered Continue is invoked', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: buildSession() });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <DriversListStep step={driversListStep} />
        </TestStepNavProvider>
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

    await waitFor(() => {
      expect(handle.current?.canContinue).toBe(true);
    });

    act(() => {
      handle.current?.onContinue();
    });

    const saveCalls = dispatchSpy.mock.calls.filter(
      ([action]) =>
        typeof action === 'object' &&
        action !== null &&
        'type' in action &&
        action.type === carrierPortalV2Actions.saveDrivers.type,
    );
    expect(saveCalls).toHaveLength(1);
    const saveArg = saveCalls[0]?.[0] as ReturnType<typeof carrierPortalV2Actions.saveDrivers>;
    expect(saveArg.payload.hasAdditionalDrivers).toBe(true);
    const drivers = saveArg.payload.drivers ?? [];
    expect(Array.isArray(drivers)).toBe(true);
    expect(drivers).toHaveLength(1);
    expect(drivers[0]).toMatchObject({
      firstName: 'Isaiah',
      lastName: 'Williams',
      email: 'isaiah@example.com',
      payType: 'PERCENTAGE',
      payRate: 70,
    });

    // US-30: never send the client-generated _tempKey or a client-side id to
    // the server. The server assigns ids; new drivers have no id.
    const submittedEntry = drivers[0] as Record<string, unknown>;
    expect(submittedEntry).not.toHaveProperty('_tempKey');
    expect(submittedEntry.id).toBeUndefined();
  });

  it('registers a disabled Continue when no drivers have been saved', () => {
    const store = buildStore({ session: buildSession() });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <DriversListStep step={driversListStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(handle.current?.canContinue).toBe(false);
  });
});
