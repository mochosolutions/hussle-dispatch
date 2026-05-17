import { act } from 'react';
import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

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
import DriversSoloConfirmStep from '.';

const soloStep: Step | undefined = driversPhase.steps.find(
  (s) => s.id === 'drivers-solo-confirm',
);
if (!soloStep) {
  throw new Error('drivers-solo-confirm step is missing from driversPhase');
}

const buildSession = (): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'drivers-solo-confirm',
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

describe('DriversSoloConfirmStep (connected)', () => {
  it('renders the confirmation copy with the step title', () => {
    const store = buildStore({ session: buildSession() });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <DriversSoloConfirmStep step={soloStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(
      screen.getByText(/got it — you're the only driver running loads/i),
    ).toBeInTheDocument();
  });

  it('renders no card content when session is null', () => {
    const store = buildStore({ session: null });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <DriversSoloConfirmStep step={soloStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(
      screen.queryByText(/got it — you're the only driver running loads/i),
    ).not.toBeInTheDocument();
  });

  it('dispatches submitStep with empty entries when registered Continue is invoked', () => {
    const store = buildStore({ session: buildSession() });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <DriversSoloConfirmStep step={soloStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(handle.current?.canContinue).toBe(true);
    act(() => {
      handle.current?.onContinue();
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.submitStep({
        stepId: 'drivers-solo-confirm',
        answers: { confirmed: true, entries: [] },
      }),
    );
  });
});
