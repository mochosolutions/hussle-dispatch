// Wave 0 scaffold — covers STAB-01 and STAB-05 reducer verification.
// Most behavior described here lands in Plan 02 (lifted currentPhase, lastSavedPhase
// rising-edge, phaseAdvanceConsumed). Until then, the assertions stay as `it.todo`.

import { carrierPortalActions, carrierPortalReducer } from '../carrierPortalSlice';

const initialState = carrierPortalReducer(undefined, { type: '@@INIT' });

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

describe('carrierPortalSlice — Plan 02 reducer behavior (placeholders)', () => {
  it.todo('setCurrentPhase no longer guards on session — writes currentPhase=3 from null session — STAB-05');
  it.todo('saveCompanySuccess sets lastSavedPhase=1 — STAB-01 rising-edge');
  it.todo('saveEquipmentSuccess sets lastSavedPhase=2 — STAB-01 rising-edge');
  it.todo('saveDriversSuccess sets lastSavedPhase=3 — STAB-01 rising-edge');
  it.todo('saveCostAnalysisSuccess sets lastSavedPhase=4 — STAB-01 rising-edge');
  it.todo('saveLanePreferencesSuccess sets lastSavedPhase=5 — STAB-01 rising-edge');
  it.todo('phaseAdvanceConsumed clears lastSavedPhase to null');
  it.todo(
    'completeOnboardingSuccess populates session.completedAt from API payload — STAB-03 transition gate',
  );
});
