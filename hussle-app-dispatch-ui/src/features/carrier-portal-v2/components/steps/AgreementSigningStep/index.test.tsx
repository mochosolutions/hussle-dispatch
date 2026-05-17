import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import type { AgreementContext, Session, Step } from '../../../engine';
import AgreementSigningStep from '.';

// Stub the DocuSeal embed so tests don't load the real iframe.
jest.mock('@docuseal/react', () => ({
  DocusealForm: ({ src, onComplete }: { src: string; onComplete: () => void }) => (
    <div data-testid="docuseal-form" data-src={src}>
      <button onClick={onComplete} data-testid="docuseal-complete">
        complete
      </button>
    </div>
  ),
}));

const signingStep: Step = {
  id: 'company-agreement',
  type: 'signing',
  title: 'Sign the dispatch agreement',
  subtitle: 'Review and sign to continue.',
  template: 'dispatch_v1',
};

const buildSession = (agreement: AgreementContext | undefined): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'company-agreement',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'carrier@example.com' },
  agreement,
});

interface BuildStoreOptions {
  session: Session | null;
  agreementFetchStatus?: 'idle' | 'pending' | 'success' | 'failure';
}

const buildStore = ({ session, agreementFetchStatus = 'success' }: BuildStoreOptions) => {
  const carrierPortalV2 = createReducer(
    {
      token: null as string | null,
      session,
      loading: { agreement: agreementFetchStatus } as Record<
        string,
        'idle' | 'pending' | 'success' | 'failure'
      >,
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

describe('AgreementSigningStep', () => {
  it('dispatches fetchAgreement on mount with templateKey DISPATCH_AGREEMENT', () => {
    const store = buildStore({ session: buildSession(undefined) });
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <AgreementSigningStep step={signingStep} />
      </Provider>,
    );

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.fetchAgreement({ templateKey: 'DISPATCH_AGREEMENT' }),
    );
  });

  it('renders the "contact dispatcher" Callout when no agreement exists and fetch succeeded', () => {
    const store = buildStore({ session: buildSession(undefined) });

    render(
      <Provider store={store}>
        <AgreementSigningStep step={signingStep} />
      </Provider>,
    );

    expect(screen.getByText(/contact them to send it/i)).toBeInTheDocument();
    expect(screen.queryByTestId('docuseal-form')).not.toBeInTheDocument();
  });

  it('renders DocusealForm with the embedUrl when status is PENDING', () => {
    const agreement: AgreementContext = {
      id: 'agr-1',
      status: 'PENDING',
      embedUrl: 'https://docuseal.example/embed/abc',
    };
    const store = buildStore({ session: buildSession(agreement) });

    render(
      <Provider store={store}>
        <AgreementSigningStep step={signingStep} />
      </Provider>,
    );

    const form = screen.getByTestId('docuseal-form');
    expect(form).toHaveAttribute('data-src', 'https://docuseal.example/embed/abc');
  });

  it('dispatches submitStep auto-advance and does NOT render DocusealForm when SIGNED', () => {
    const agreement: AgreementContext = {
      id: 'agr-1',
      status: 'SIGNED',
      embedUrl: null,
    };
    const store = buildStore({ session: buildSession(agreement) });
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <AgreementSigningStep step={signingStep} />
      </Provider>,
    );

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.submitStep({
        stepId: 'company-agreement',
        answers: { acknowledged: true },
      }),
    );
    expect(screen.queryByTestId('docuseal-form')).not.toBeInTheDocument();
  });

  it('handleSigned (DocusealForm onComplete) dispatches navigation submitStep only', async () => {
    const user = userEvent.setup();
    const agreement: AgreementContext = {
      id: 'agr-1',
      status: 'PENDING',
      embedUrl: 'https://docuseal.example/embed/abc',
    };
    const store = buildStore({ session: buildSession(agreement) });
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <AgreementSigningStep step={signingStep} />
      </Provider>,
    );

    await user.click(screen.getByTestId('docuseal-complete'));

    expect(dispatchSpy).toHaveBeenCalledWith(
      carrierPortalV2Actions.submitStep({
        stepId: 'company-agreement',
        answers: { signed: true },
      }),
    );
  });
});

