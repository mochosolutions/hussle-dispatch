import { combineReducers, configureStore, createReducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, render, screen, waitFor } from '@testing-library/react';

import type { Session, Step } from '../../../engine';
import {
  carrierPortalV2Actions,
  type LoadingStatus,
} from '../../../store/reducers/carrierPortalSlice';
import {
  TestStepNavProvider,
  type StepNavTestHandle,
} from '../../StepNavContext';
import CostAnalysisStep from '.';
import { computeDerivedValues, type CostInputs } from './computations';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const step: Step = {
  id: 'cost-analysis',
  type: 'costAnalysis',
  title: 'What does it cost you to run a truck?',
  subtitle: 'Estimate your fleet costs.',
};

const VEHICLE_ID_1 = '11111111-1111-4111-8111-111111111111';
const VEHICLE_ID_2 = '22222222-2222-4222-8222-222222222222';

const buildSession = (vehicles: { id: string; type?: string; year?: string }[]): Session => ({
  id: 'sess-1',
  carrierId: 'carr-1',
  currentStepId: 'cost-analysis',
  completedStepIds: ['equipment-entry'],
  answers: {
    'equipment-entry': { vehicles },
  },
  invitation: { email: 'carrier@example.com' },
});

interface SliceState {
  token: string | null;
  session: Session | null;
  loading: Record<string, LoadingStatus>;
  errors: Record<string, string>;
  lastSavedAt: string | null;
}

const buildStore = (session: Session | null, costStatus: LoadingStatus = 'idle') => {
  const carrierPortalV2 = createReducer<SliceState>(
    {
      token: 'token-1',
      session,
      loading: { costAnalysis: costStatus },
      errors: {},
      lastSavedAt: null,
    },
    () => undefined,
  );
  const pages = combineReducers({ carrierPortalV2 });
  return configureStore({ reducer: { pages } });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CostAnalysisStep', () => {
  it('renders empty-state RateCard and registers a disabled Continue when no vehicles exist', () => {
    const store = buildStore(buildSession([]));
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <CostAnalysisStep step={step} />
        </TestStepNavProvider>
      </Provider>,
    );

    // RateCard renders the em-dash placeholders.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/add at least one vehicle in the equipment phase/i),
    ).toBeInTheDocument();

    expect(handle.current?.canContinue).toBe(false);
  });

  it('renders one AssetPaymentRow per vehicle from equipment-entry answers', () => {
    const store = buildStore(
      buildSession([
        { id: VEHICLE_ID_1, type: 'semi', year: '2022' },
        { id: VEHICLE_ID_2, type: 'trailer', year: '2019' },
      ]),
    );
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <CostAnalysisStep step={step} />
        </TestStepNavProvider>
      </Provider>,
    );

    // The renderer assembles each row with `name={equipmentPayments-${vehicleId}}` —
    // the amount input renders with that exact id, so we can query both rows by id.
    expect(document.getElementById(`equipmentPayments-${VEHICLE_ID_1}`)).not.toBeNull();
    expect(document.getElementById(`equipmentPayments-${VEHICLE_ID_2}`)).not.toBeNull();
  });

  it('computes break-even CPM correctly from known inputs', () => {
    // Sanity-check the pure helper: a single financed truck @ $1000/mo equipment
    // payment, $1/gal diesel at 1 MPG, 1000 loaded miles, 0% deadhead, 0% margin.
    // fixedMonthly = 1000 + ownerPayMonthly (0) = 1000.
    // variablePerMile = 1.0 (fuel).
    // breakEven = (1000 / 1000) + 1.0 + 0 = 2.0
    const inputs: CostInputs = {
      equipmentPayments: [
        { assetId: VEHICLE_ID_1, ownership: 'financed', monthlyAmount: 1000, insuranceMonthlyAmount: 0 },
      ],
      policies: [],
      subscriptions: [],
      overhead: { officeUtilities: 0, accountingLegal: 0, bankFeesCardsFactoring: 0 },
      ownerPay: { perTruckWeekly: 0, payBasis: 'net' },
      fuel: { dieselPrice: 1, mpg: 1 },
      wearOps: { maintenance: 0, tires: 0, def: 0, tolls: 0 },
      operating: { loadedMilesPerMonth: 1000, deadheadPct: 0, marginPct: 0 },
    };

    const derived = computeDerivedValues(inputs);

    expect(derived.fixedMonthly).toBe(1000);
    expect(derived.variablePerMile).toBe(1);
    expect(derived.breakEvenCpm).toBe(2);
    expect(derived.minRatePerMile).toBe(2);
  });

  it('dispatches saveCostAnalysis with vehicleId-keyed equipmentPayments payload when registered Continue is invoked', async () => {
    const store = buildStore(
      buildSession([
        { id: VEHICLE_ID_1, type: 'semi' },
        { id: VEHICLE_ID_2, type: 'trailer' },
      ]),
    );
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const handle: StepNavTestHandle = { current: null };

    render(
      <Provider store={store}>
        <TestStepNavProvider handle={handle}>
          <CostAnalysisStep step={step} />
        </TestStepNavProvider>
      </Provider>,
    );

    expect(handle.current?.canContinue).toBe(true);

    await act(async () => {
      await handle.current?.onContinue();
    });

    await waitFor(() => {
      const found = dispatchSpy.mock.calls.find(([action]) =>
        carrierPortalV2Actions.saveCostAnalysis.match(action),
      );
      expect(found).toBeDefined();
    });

    const submitCall = dispatchSpy.mock.calls.find(([action]) =>
      carrierPortalV2Actions.saveCostAnalysis.match(action),
    );
    expect(submitCall).toBeDefined();
    const action = submitCall?.[0] as ReturnType<typeof carrierPortalV2Actions.saveCostAnalysis>;

    const payload = action.payload as {
      equipmentPayments: { assetId: string; ownership: string; monthlyAmount: number }[];
      policies: unknown[];
      subscriptions: unknown[];
      overhead: Record<string, number>;
      ownerPay: Record<string, unknown>;
      fuel: Record<string, number>;
      wearOps: Record<string, number>;
      operating: Record<string, number>;
    };

    expect(payload.equipmentPayments).toHaveLength(2);
    expect(payload.equipmentPayments[0]?.assetId).toBe(VEHICLE_ID_1);
    expect(payload.equipmentPayments[1]?.assetId).toBe(VEHICLE_ID_2);
    expect(payload.equipmentPayments[0]?.ownership).toBe('financed');
    expect(payload.ownerPay.payBasis).toBe('net');
    expect(payload.overhead).toEqual({
      officeUtilities: 0,
      accountingLegal: 0,
      bankFeesCardsFactoring: 0,
    });
    expect(Array.isArray(payload.policies)).toBe(true);
    expect(Array.isArray(payload.subscriptions)).toBe(true);
  });
});
