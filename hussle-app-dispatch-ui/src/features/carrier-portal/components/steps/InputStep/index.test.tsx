import { act } from 'react';
import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Session, Step } from '../../../engine';
import {
  carrierPortalV2Actions,
  type LoadingStatus,
} from '../../../store/reducers/carrierPortalSlice';
import {
  TestStepNavProvider,
  type StepNavTestHandle,
} from '../../StepNavContext';
import InputStep from '.';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const companyStep: Step = {
  id: 'company-info',
  type: 'input',
  title: 'Company information',
  subtitle: 'Confirm your company details.',
  questions: [
    {
      id: 'legalName',
      label: 'Legal name',
      fieldType: 'text',
      prefillFrom: 'fmcsa.legalName',
    },
    {
      id: 'contactEmail',
      label: 'Contact email',
      fieldType: 'email',
    },
    {
      id: 'preferDispatcherContact',
      label: 'Prefer dispatcher contact',
      fieldType: 'checkbox',
      optional: true,
    },
    {
      id: 'dispatcherPhone',
      label: 'Dispatcher phone',
      fieldType: 'text',
      visibility: {
        op: 'eq',
        field: 'answers.company-info.preferDispatcherContact',
        value: true,
      },
    },
  ],
};

const baseSession: Session = {
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'company-info',
  completedStepIds: [],
  answers: {},
  fmcsaSnapshot: {
    legalName: 'Acme Trucking LLC',
  },
  invitation: { email: 'carrier@example.com' },
};

interface BuildStoreOptions {
  session: Session | null;
  isLocked?: boolean;
}

const buildStore = ({ session, isLocked = false }: BuildStoreOptions) => {
  const sessionWithLock: Session | null = session
    ? {
        ...session,
        agreement: isLocked
          ? { id: 'agr-1', status: 'SIGNED', signedFieldsLocked: true }
          : session.agreement,
      }
    : null;

  const carrierPortalV2 = createReducer(
    {
      token: null as string | null,
      session: sessionWithLock,
      loading: {} as Record<string, LoadingStatus>,
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InputStep', () => {
  it('renders all visible questions for the given step', () => {
    const store = buildStore({ session: baseSession });

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <InputStep step={companyStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(screen.getByText('Legal name')).toBeInTheDocument();
    expect(screen.getByText('Contact email')).toBeInTheDocument();
    expect(screen.getByText('Prefer dispatcher contact')).toBeInTheDocument();
  });

  it('does not render a question whose visibility predicate evaluates to false', () => {
    const store = buildStore({ session: baseSession });

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <InputStep step={companyStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    // preferDispatcherContact defaults to false → dispatcherPhone is hidden
    expect(screen.queryByText('Dispatcher phone')).not.toBeInTheDocument();
  });

  it('prefills a field from session context via the question.prefillFrom dot-path', () => {
    const store = buildStore({ session: baseSession });

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <InputStep step={companyStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    const legalNameInput = screen.getByLabelText(/legal name/i) as HTMLInputElement;
    expect(legalNameInput.value).toBe('Acme Trucking LLC');
  });

  it('wraps a LOCKS_FIELDS company-phase question in the locked read-only display when the session is locked', () => {
    const lockedSession: Session = {
      ...baseSession,
      answers: {
        'company-info': { legalName: 'Acme Trucking LLC', contactEmail: 'a@b.com' },
      },
    };
    const store = buildStore({ session: lockedSession, isLocked: true });

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <InputStep step={companyStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    // Locked display surfaces the value as text and renders a tooltip-trigger
    // labeled with the lock message — no text input is rendered for legalName.
    expect(
      screen.getByLabelText(
        /Locked after agreement signed. Contact your dispatcher to amend./i,
      ),
    ).toBeInTheDocument();
    // The non-lockable contactEmail question still renders as an editable input.
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
  });

  it('dispatches submitStep with only visible-field answers when registered Continue is invoked', async () => {
    const user = userEvent.setup();
    const store = buildStore({ session: baseSession });
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <InputStep step={companyStep} />
        </TestStepNavProvider>
      </Provider>,
    );

    const emailInput = screen.getByLabelText(/contact email/i);
    await user.type(emailInput, 'ops@acme.com');

    // Wait for the form to become valid so the registered handler reflects it.
    await waitFor(() => {
      expect(handle.current?.canContinue).toBe(true);
    });

    await act(async () => {
      await handle.current?.onContinue();
    });

    const submitCall = dispatchSpy.mock.calls.find(
      ([action]) => carrierPortalV2Actions.submitStep.match(action),
    );
    expect(submitCall).toBeDefined();
    const action = submitCall?.[0] as ReturnType<typeof carrierPortalV2Actions.submitStep>;
    expect(action.payload.stepId).toBe('company-info');
    expect(action.payload.answers).not.toHaveProperty('dispatcherPhone');
    expect(action.payload.answers.contactEmail).toBe('ops@acme.com');
  });
});
