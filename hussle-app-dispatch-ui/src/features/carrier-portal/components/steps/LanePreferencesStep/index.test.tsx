// ---------------------------------------------------------------------------
// LanePreferencesStep — unit tests (US-22 T-52)
//
// 4 test cases:
//   1. Renders "Fleet default" scope + all 3 section heads.
//   2. Switching to Per-driver shows DriverChip bar + EditingCallout.
//   3. Owner-operator (0 drivers): per-driver switch is not usable.
//   4. Submit button dispatches saveLanePreferences({ fleet, overrides }).
// ---------------------------------------------------------------------------

import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react';

import type { Session, Step } from '../../../engine';
import { carrierPortalV2Actions, type LoadingStatus } from '../../../store/reducers/carrierPortalSlice';
import {
  TestStepNavProvider,
  type StepNavTestHandle,
} from '../../StepNavContext';
import LanePreferencesStep from '.';

// ---------------------------------------------------------------------------
// Mocks — stub heavy visual primitives to keep tests fast + unambiguous
// ---------------------------------------------------------------------------

jest.mock('features/carrier-portal/components/LaneStateMap', () => ({
  __esModule: true,
  default: () => <div data-testid="LaneStateMap" />,
}));

jest.mock('features/carrier-portal/components/ScheduleGrid', () => ({
  __esModule: true,
  default: () => <div data-testid="ScheduleGrid" />,
}));

jest.mock('features/carrier-portal/components/SchedulePresetGroup', () => ({
  __esModule: true,
  default: () => <div data-testid="SchedulePresetGroup" />,
}));

jest.mock('features/carrier-portal/components/OptCard', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div data-testid={`OptCard-${label}`} />,
}));

jest.mock('features/carrier-portal/components/FreightChip', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div data-testid={`FreightChip-${label}`} />,
}));

jest.mock('features/carrier-portal/components/ScopeBar', () => ({
  __esModule: true,
  default: ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div data-testid="ScopeBar">
      {options.map((opt) => (
        <button
          key={opt.value}
          data-testid={`scope-${opt.value}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('features/carrier-portal/components/DriverChip', () => ({
  __esModule: true,
  default: ({ name, onClick }: { name: string; onClick?: () => void }) => (
    <button data-testid={`DriverChip-${name}`} onClick={onClick} type="button">
      {name}
    </button>
  ),
}));

jest.mock('features/carrier-portal/components/SectionHead', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid={`SectionHead-${title}`}>{title}</div>
  ),
}));

jest.mock('features/carrier-portal/components/OverrideBadge', () => ({
  __esModule: true,
  default: () => <span data-testid="OverrideBadge">Override</span>,
}));

jest.mock('features/carrier-portal/components/EditingCallout', () => ({
  __esModule: true,
  default: ({ message }: { message: React.ReactNode }) => (
    <div data-testid="EditingCallout">{message}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const step: Step = {
  id: 'lane-preferences',
  type: 'lanePreferences',
  title: 'Where do you want to run, and when?',
};

interface SliceState {
  token: string | null;
  session: Session | null;
  loading: Record<string, LoadingStatus>;
  errors: Record<string, string>;
  lastSavedAt: string | null;
}

const buildStore = (session: Session | null, laneStatus: LoadingStatus = 'idle') => {
  const carrierPortalV2 = createReducer<SliceState>(
    {
      token: 'token-1',
      session,
      loading: { lanePreferences: laneStatus },
      errors: {},
      lastSavedAt: null,
    },
    () => undefined,
  );
  const pages = combineReducers({ carrierPortalV2 });
  return configureStore({ reducer: { pages } });
};

const buildSession = (
  drivers: { id: string; firstName?: string; lastName?: string }[],
  answers: Record<string, unknown> = {},
): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'lane-preferences',
  completedStepIds: [],
  answers: {
    'drivers-list': { entries: drivers },
    ...answers,
  },
  invitation: { email: 'carrier@example.com' },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LanePreferencesStep', () => {
  it('renders Fleet default scope title and all 3 section heads', () => {
    const session = buildSession([{ id: 'd1', firstName: 'James', lastName: 'Miller' }]);
    const store = buildStore(session);

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <LanePreferencesStep step={step} />
        </TestStepNavProvider>
      </Provider>,
    );

    // ScopeBar rendered with "Fleet default" tab active
    expect(screen.getByTestId('ScopeBar')).toBeInTheDocument();
    const fleetTab = screen.getByTestId('scope-fleet');
    expect(fleetTab).toBeInTheDocument();
    expect(fleetTab).toHaveAttribute('aria-pressed', 'true');

    // All 3 section heads present
    expect(screen.getByTestId('SectionHead-Lanes')).toBeInTheDocument();
    expect(screen.getByTestId('SectionHead-Weekly schedule')).toBeInTheDocument();
    expect(screen.getByTestId('SectionHead-Freight types')).toBeInTheDocument();

    // The primitive section components are rendered
    expect(screen.getByTestId('LaneStateMap')).toBeInTheDocument();
    expect(screen.getByTestId('ScheduleGrid')).toBeInTheDocument();
    // Freight chips render at least the first chip (dry van)
    expect(screen.getByTestId('FreightChip-Dry van')).toBeInTheDocument();
  });

  it('shows DriverChip bar and EditingCallout after switching to per-driver scope', async () => {
    const session = buildSession([
      { id: 'd1', firstName: 'James', lastName: 'Miller' },
      { id: 'd2', firstName: 'Maya', lastName: 'Carter' },
    ]);
    const store = buildStore(session);

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <LanePreferencesStep step={step} />
        </TestStepNavProvider>
      </Provider>,
    );

    // Initially DriverChip bar is not shown
    expect(screen.queryByTestId('DriverChip-James Miller')).not.toBeInTheDocument();
    expect(screen.queryByTestId('EditingCallout')).not.toBeInTheDocument();

    // Click "Per-driver overrides" scope tab
    await act(async () => {
      fireEvent.click(screen.getByTestId('scope-per_driver'));
    });

    // DriverChips for both drivers appear
    expect(screen.getByTestId('DriverChip-James Miller')).toBeInTheDocument();
    expect(screen.getByTestId('DriverChip-Maya Carter')).toBeInTheDocument();

    // EditingCallout appears for the active driver
    expect(screen.getByTestId('EditingCallout')).toBeInTheDocument();
  });

  it('does not switch to per-driver scope when there are no drivers (owner-operator)', async () => {
    // 0 drivers = owner-operator
    const session = buildSession([]);
    const store = buildStore(session);

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <LanePreferencesStep step={step} />
        </TestStepNavProvider>
      </Provider>,
    );

    // Scope bar is still rendered
    expect(screen.getByTestId('ScopeBar')).toBeInTheDocument();

    // Click the per-driver tab
    await act(async () => {
      fireEvent.click(screen.getByTestId('scope-per_driver'));
    });

    // Fleet scope is still active — no driver chips appear
    const fleetTab = screen.getByTestId('scope-fleet');
    expect(fleetTab).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId(/^DriverChip-/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('EditingCallout')).not.toBeInTheDocument();
  });

  it('dispatches saveLanePreferences with { fleet, overrides } payload when registered Continue is invoked', () => {
    const session = buildSession([{ id: 'd1', firstName: 'James', lastName: 'Miller' }]);
    const store = buildStore(session);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const handle: StepNavTestHandle = { current: null };
    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <LanePreferencesStep step={step} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(handle.current?.canContinue).toBe(true);
    act(() => {
      handle.current?.onContinue();
    });

    const found = dispatchSpy.mock.calls.find(([action]) =>
      carrierPortalV2Actions.saveLanePreferences.match(action),
    );
    expect(found).toBeDefined();

    const action = found?.[0] as ReturnType<typeof carrierPortalV2Actions.saveLanePreferences>;
    const payload = action.payload as { fleet: unknown; overrides: unknown };

    expect(payload).toHaveProperty('fleet');
    expect(payload).toHaveProperty('overrides');
    expect(typeof payload.fleet).toBe('object');
    expect(typeof payload.overrides).toBe('object');
  });
});
