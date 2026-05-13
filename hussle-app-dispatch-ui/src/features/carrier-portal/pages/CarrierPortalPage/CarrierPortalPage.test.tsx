// Wave 0 scaffold — covers STAB-01, STAB-02, STAB-03 page-level behavior.
// All assertions are `it.todo` placeholders; they flip to real assertions as
// Plan 02 (Save & Continue + advance), Plan 03 (snackbar + scroll), and Plan 06
// (PortalCompleteView + Phase 4 CostResultCard wiring) land.

// Mock notistack so future assertions can spy on enqueueSnackbar.
jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
  closeSnackbar: jest.fn(),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
  useSnackbar: () => ({ enqueueSnackbar: jest.fn(), closeSnackbar: jest.fn() }),
}));

// Polyfill scrollIntoView for jsdom — Plan 03 will assert this is called on errors.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe('CarrierPortalPage — Plan 02/03/06 behavior (placeholders)', () => {
  it.todo('Save & Continue dispatches saveCompany when validation passes — STAB-01');
  it.todo('Save & Continue fires enqueueSnackbar + scrollIntoView when validation fails — STAB-02');
  it.todo('Final phase dispatches completeOnboarding (not sessionCompleted) — STAB-03');
  it.todo('lastSavedPhase rising-edge advances currentPhase by 1 — STAB-01');
  it.todo('renders PortalCompleteView when session.completedAt is non-null — STAB-03 transition gate');
  it.todo(
    'Phase 4 thread is replaced by CostResultCard once all 6 cost-analysis fields are populated, and CTA dispatches saveCostAnalysis — STAB-08 wiring',
  );
});
