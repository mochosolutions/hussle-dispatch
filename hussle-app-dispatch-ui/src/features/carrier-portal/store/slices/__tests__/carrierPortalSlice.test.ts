// Wave 0 scaffold flipped green by Plan 02 — covers STAB-01 and STAB-05 reducer
// verification: lifted currentPhase, lastSavedPhase rising-edge, phaseAdvanceConsumed,
// and the new cost-analysis / lane-preferences action triples.

import type { OnboardingSession } from 'features/carrier-portal/types';

import { carrierPortalActions, carrierPortalReducer } from '../carrierPortalSlice';

const initialState = carrierPortalReducer(undefined, { type: '@@INIT' });

const seededSession: OnboardingSession = {
  id: 'session-1',
  carrierId: 'carrier-1',
  currentPhase: 5,
  currentQuestionIndex: 0,
  completedPhases: [1, 2, 3, 4, 5],
  lastActiveAt: '2026-05-13T11:00:00.000Z',
  completedAt: null,
  createdAt: '2026-05-13T10:00:00.000Z',
  updatedAt: '2026-05-13T11:00:00.000Z',
};

describe('carrierPortalSlice — initial state', () => {
  it('initializes with no session, no carrier, empty answers', () => {
    // Assert
    expect(initialState.session).toBeNull();
    expect(initialState.carrier).toBeNull();
    expect(initialState.answers).toEqual({});
    expect(initialState.savingPhase).toBe(false);
  });
});

describe('carrierPortalSlice — phase save flags (existing behavior)', () => {
  it('saveCompany sets savingPhase=true and clears error', () => {
    // Arrange
    const stateWithError = { ...initialState, error: 'previous error' };

    // Act
    const next = carrierPortalReducer(
      stateWithError,
      carrierPortalActions.saveCompany({ name: 'ACME Trucking' }),
    );

    // Assert
    expect(next.savingPhase).toBe(true);
    expect(next.error).toBeNull();
  });

  it('saveCompanySuccess clears savingPhase', () => {
    // Arrange
    const saving = { ...initialState, savingPhase: true };

    // Act
    const next = carrierPortalReducer(saving, carrierPortalActions.saveCompanySuccess());

    // Assert
    expect(next.savingPhase).toBe(false);
  });

  it('saveCompanyFailure surfaces the error message', () => {
    // Arrange
    const saving = { ...initialState, savingPhase: true };

    // Act
    const next = carrierPortalReducer(
      saving,
      carrierPortalActions.saveCompanyFailure('network down'),
    );

    // Assert
    expect(next.savingPhase).toBe(false);
    expect(next.error).toBe('network down');
  });
});

// ---------------------------------------------------------------------------
// Plan 02 behavior — placeholders. Flip to real `it()` calls once the slice
// learns `currentPhase`, `lastSavedPhase`, and `phaseAdvanceConsumed`.
// ---------------------------------------------------------------------------

describe('carrierPortalSlice — Plan 02 reducer behavior', () => {
  it('setCurrentPhase no longer guards on session — writes currentPhase=3 from null session — STAB-05', () => {
    // Arrange
    expect(initialState.session).toBeNull();

    // Act
    const next = carrierPortalReducer(initialState, carrierPortalActions.setCurrentPhase(3));

    // Assert
    expect(next.currentPhase).toBe(3);
  });

  it('saveCompanySuccess sets lastSavedPhase=1 — STAB-01 rising-edge', () => {
    const next = carrierPortalReducer(initialState, carrierPortalActions.saveCompanySuccess());
    expect(next.lastSavedPhase).toBe(1);
  });

  it('saveEquipmentSuccess sets lastSavedPhase=2 — STAB-01 rising-edge', () => {
    const next = carrierPortalReducer(initialState, carrierPortalActions.saveEquipmentSuccess());
    expect(next.lastSavedPhase).toBe(2);
  });

  it('saveDriversSuccess sets lastSavedPhase=3 — STAB-01 rising-edge', () => {
    const next = carrierPortalReducer(initialState, carrierPortalActions.saveDriversSuccess());
    expect(next.lastSavedPhase).toBe(3);
  });

  it('saveCostAnalysisSuccess sets lastSavedPhase=4 — STAB-01 rising-edge', () => {
    const next = carrierPortalReducer(
      initialState,
      carrierPortalActions.saveCostAnalysisSuccess(),
    );
    expect(next.lastSavedPhase).toBe(4);
  });

  it('saveLanePreferencesSuccess sets lastSavedPhase=5 — STAB-01 rising-edge', () => {
    const next = carrierPortalReducer(
      initialState,
      carrierPortalActions.saveLanePreferencesSuccess(),
    );
    expect(next.lastSavedPhase).toBe(5);
  });

  it('phaseAdvanceConsumed clears lastSavedPhase to null', () => {
    // Arrange
    const dirty = { ...initialState, lastSavedPhase: 3 };

    // Act
    const next = carrierPortalReducer(dirty, carrierPortalActions.phaseAdvanceConsumed());

    // Assert
    expect(next.lastSavedPhase).toBeNull();
  });

  it('completeOnboardingSuccess populates session.completedAt from API payload — STAB-03 transition gate', () => {
    // Arrange
    const before = { ...initialState, session: { ...seededSession, completedAt: null } };
    const payload: OnboardingSession = {
      ...seededSession,
      completedAt: '2026-05-13T12:00:00.000Z',
    };

    // Act
    const after = carrierPortalReducer(
      before,
      carrierPortalActions.completeOnboardingSuccess(payload),
    );

    // Assert
    expect(after.session?.completedAt).toBe('2026-05-13T12:00:00.000Z');
    expect(after.lastSavedPhase).toBe(6);
  });
});
