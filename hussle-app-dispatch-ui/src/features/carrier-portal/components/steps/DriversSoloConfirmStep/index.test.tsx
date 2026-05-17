import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  carrierPortalV2Actions,
  carrierPortalV2Reducer,
} from '../../../store/reducers/carrierPortalSlice';
import type { Session, Step } from '../../../engine';
import { driversPhase } from '../../../schema/driversPhase';
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

    render(
      <Provider store={store}>
        <DriversSoloConfirmStep step={soloStep} />
      </Provider>,
    );

    expect(
      screen.getByText(/got it — you're the only driver running loads/i),
    ).toBeInTheDocument();
  });

  it('renders nothing when session is null', () => {
    const store = buildStore({ session: null });

    const { container } = render(
      <Provider store={store}>
        <DriversSoloConfirmStep step={soloStep} />
      </Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('dispatches submitStep with empty entries when Continue is clicked', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: buildSession() });
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <DriversSoloConfirmStep step={soloStep} />
      </Provider>,
    );

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toBeDisabled();

    await user.click(continueButton);

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.submitStep({
        stepId: 'drivers-solo-confirm',
        answers: { confirmed: true, entries: [] },
      }),
    );
  });
});
