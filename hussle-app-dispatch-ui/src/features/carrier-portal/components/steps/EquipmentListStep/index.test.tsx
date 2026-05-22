import { act } from 'react';
import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  carrierPortalV2Actions,
  carrierPortalV2Reducer,
} from '../../../store/reducers/carrierPortalSlice';
import type { Session } from '../../../engine';
import { equipmentPhase } from '../../../schema/equipmentPhase';
import { TestStepNavProvider, type StepNavTestHandle } from '../../StepNavContext';
import EquipmentListStep from '.';

const equipmentStep = equipmentPhase.steps[0];
if (!equipmentStep) {
  throw new Error('equipmentPhase.steps[0] is missing');
}

const buildSession = (): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'equipment-entry',
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
      // No-op: tests assert dispatched actions via spy; state mutations not needed.
    },
  );
  const pages = combineReducers({ carrierPortalV2 });
  return configureStore({ reducer: { pages } });
};

// Keep the unused reducer import alive so the actions remain in sync with the slice.
void carrierPortalV2Reducer;

describe('EquipmentListStep (connected)', () => {
  it('renders the empty state when no vehicles have been added', () => {
    const store = buildStore({ session: buildSession() });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <EquipmentListStep step={equipmentStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(screen.getByText('No vehicles yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add your first vehicle/i })).toBeInTheDocument();
  });

  it('opens the inline form when "Add your first vehicle" is clicked', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: buildSession() });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <EquipmentListStep step={equipmentStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /add your first vehicle/i }));

    expect(screen.getByText('Add a vehicle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save vehicle$/i })).toBeInTheDocument();
  });

  it('dispatches submitStep with a vehicles array after a vehicle is saved and registered Continue is invoked', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: buildSession() });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <EquipmentListStep step={equipmentStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /add your first vehicle/i }));

    await user.type(screen.getByLabelText(/year/i), '2022');
    await user.type(screen.getByLabelText(/make/i), 'Freightliner');
    await user.type(screen.getByLabelText(/model/i), 'Cascadia');
    await user.type(screen.getByLabelText(/vin/i), '1FUJG6DR9NL000001');
    await user.type(screen.getByLabelText(/license plate/i), 'NC-TR4892');
    await user.type(screen.getByLabelText(/gvwr/i), '80000');

    await user.click(screen.getByRole('button', { name: /save vehicle$/i }));

    await waitFor(() => {
      expect(handle.current?.canContinue).toBe(true);
    });

    act(() => {
      handle.current?.onContinue();
    });

    const submitCalls = dispatchSpy.mock.calls.filter(
      ([action]) =>
        typeof action === 'object' &&
        action !== null &&
        'type' in action &&
        action.type === carrierPortalV2Actions.submitStep.type,
    );
    expect(submitCalls).toHaveLength(1);
    const submitArg = submitCalls[0]?.[0] as ReturnType<typeof carrierPortalV2Actions.submitStep>;
    expect(submitArg.payload.stepId).toBe('equipment-entry');
    const vehicles = (submitArg.payload.answers as { vehicles: unknown[] }).vehicles;
    expect(Array.isArray(vehicles)).toBe(true);
    expect(vehicles).toHaveLength(1);
    expect(vehicles[0]).toMatchObject({
      category: 'SEMI_TRUCK',
      year: 2022,
      make: 'Freightliner',
      model: 'Cascadia',
      vin: '1FUJG6DR9NL000001',
      licensePlate: 'NC-TR4892',
      gvwr: 80000,
      type: 'truck',
    });

    // US-30: never send the client-generated _tempKey or a client-side id to
    // the server. The server assigns ids on persist; new vehicles have no id.
    const submittedVehicle = vehicles[0] as Record<string, unknown>;
    expect(submittedVehicle).not.toHaveProperty('_tempKey');
    expect(submittedVehicle.id).toBeUndefined();
  });

  it('registers a disabled Continue when no vehicles have been saved', () => {
    const store = buildStore({ session: buildSession() });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <EquipmentListStep step={equipmentStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(handle.current?.canContinue).toBe(false);
  });
});
