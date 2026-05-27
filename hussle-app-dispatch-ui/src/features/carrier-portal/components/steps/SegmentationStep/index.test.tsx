import { act } from 'react';
import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  carrierPortalV2Actions,
  carrierPortalV2Reducer,
} from '../../../store/reducers/carrierPortalSlice';
import type { Session } from '../../../engine';
import { welcomePhase } from '../../../schema/welcomePhase';
import {
  TestStepNavProvider,
  type StepNavTestHandle,
} from '../../StepNavContext';
import SegmentationStep from '.';

const welcomeStep = welcomePhase.steps[0];
if (!welcomeStep) {
  throw new Error('welcomePhase.steps[0] is missing');
}

const buildSession = (organizationName: string | null): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'welcome-segmentation',
  completedStepIds: [],
  answers: {},
  invitation: {
    email: 'carrier@example.com',
    organizationName,
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

describe('SegmentationStep (connected)', () => {
  it('renders the generic appName eyebrow when session is null', () => {
    const store = buildStore({ session: null });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <SegmentationStep step={welcomeStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(screen.getByText('Invited to Hussle Dispatch')).toBeInTheDocument();
  });

  it('renders the organization-name eyebrow when invitation.organizationName is set', () => {
    const store = buildStore({ session: buildSession('Acme Dispatch') });
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <SegmentationStep step={welcomeStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(screen.getByText('Invited by Acme Dispatch')).toBeInTheDocument();
  });

  it('registers a Continue that no-ops until a selection is made', () => {
    const store = buildStore({ session: buildSession('Acme Dispatch') });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <SegmentationStep step={welcomeStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    // Continue is always clickable (no dead-end disabled state) — verified by
    // canContinue=true even before any card is selected.
    expect(handle.current?.canContinue).toBe(true);

    // But invoking onContinue without a selection no-ops — no submit dispatched.
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
    expect(submitCalls).toHaveLength(0);
  });

  it('dispatches submitStep with selected carrier_type on Continue', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: buildSession(null) });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <SegmentationStep step={welcomeStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    const ownerOperatorCard = screen.getByRole('radio', { name: /owner-operator/i });
    await user.click(ownerOperatorCard);

    expect(handle.current?.canContinue).toBe(true);
    act(() => {
      handle.current?.onContinue();
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.submitStep({
        stepId: 'welcome-segmentation',
        answers: { carrier_type: 'owner_operator' },
      }),
    );
  });
});
