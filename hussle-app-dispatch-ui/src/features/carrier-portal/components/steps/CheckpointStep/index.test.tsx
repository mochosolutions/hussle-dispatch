import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Phase, Step } from '../../../engine';
import {
  carrierPortalV2Actions,
  type LoadingStatus,
} from '../../../store/reducers/carrierPortalSlice';
import CheckpointStep from '.';

const checkpointStep: Step = {
  id: 'company-complete-checkpoint',
  type: 'checkpoint',
};

const phaseWithCheckpoint: Phase = {
  id: 'company',
  label: 'Company',
  steps: [checkpointStep],
  checkpoint: {
    title: 'Company info complete',
    body: 'Your business details are saved. Next up: tell us about your equipment.',
    upcoming: ['Equipment', 'Drivers'],
  },
};

const buildStore = () => {
  const carrierPortalV2 = createReducer(
    {
      token: null as string | null,
      session: null,
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

describe('CheckpointStep', () => {
  it('renders the checkpoint title, body, and upcoming list', () => {
    const store = buildStore();

    render(
      <Provider store={store}>
        <CheckpointStep step={checkpointStep} phase={phaseWithCheckpoint} />
      </Provider>,
    );

    expect(screen.getByText('Company info complete')).toBeInTheDocument();
    expect(screen.getByText(/Your business details are saved/i)).toBeInTheDocument();
    expect(screen.getByText('COMING UP NEXT')).toBeInTheDocument();
    expect(screen.getByText('• Equipment')).toBeInTheDocument();
    expect(screen.getByText('• Drivers')).toBeInTheDocument();
  });

  it('dispatches submitStep advance when Continue is clicked', async () => {
    const user = userEvent.setup();
    const store = buildStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <CheckpointStep step={checkpointStep} phase={phaseWithCheckpoint} />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.submitStep({
        stepId: 'company-complete-checkpoint',
        answers: { acknowledged: true },
      }),
    );
  });
});
