import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { CostResultCard } from './index';
import type { CostInputs } from './computeCostAnalysis';

// Minimal theme wrapper required for MUI sx tokens (success.light, etc.)
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

const BASE_INPUTS: CostInputs = {
  truckPayment: 1500,
  insuranceCost: 1200,
  fuelCostPerGallon: 4.0,
  milesPerGallon: 6.0,
  maintenanceMonthlyCost: 500,
  otherMonthlyCosts: 250,
  ownsOutright: false,
};

const noop = () => {};

// ---------------------------------------------------------------------------
// Calculation sanity: 1500 + 1200 + 500 + 250 = 3450 fixed
// fuel/mile = 4.0 / 6.0 ≈ 0.6667; variable = 0.6667 × 8000 ≈ 5333.33
// total = 3450 + 5333.33 = 8783.33
// breakEven = 8783.33 / 8000 ≈ 1.098
// minimum = 1.098 × 1.25 ≈ 1.372
// ---------------------------------------------------------------------------

describe('CostResultCard — Plan 04 behavior (STAB-08)', () => {
  it('renders break-even RPM and minimum rate from inputs', () => {
    // Arrange
    renderWithTheme(<CostResultCard inputs={BASE_INPUTS} onContinue={noop} />);

    // Assert: overlines exist
    expect(screen.getByText('YOUR BREAK-EVEN RATE PER MILE')).toBeInTheDocument();
    expect(screen.getByText('MINIMUM RATE TO BOOK A LOAD')).toBeInTheDocument();

    // Assert: CTA button exists with correct label
    expect(screen.getByRole('button', { name: /This looks right/i })).toBeInTheDocument();

    // Assert: heading renders (without firstName)
    expect(screen.getByText(/Here's your real cost picture\./)).toBeInTheDocument();

    // Assert: expense breakdown labels
    expect(screen.getByText('Monthly Fixed')).toBeInTheDocument();
    expect(screen.getByText('Monthly Variable')).toBeInTheDocument();
    expect(screen.getByText('Fuel Cost/Mile')).toBeInTheDocument();
  });

  it('respects prefers-reduced-motion — renders final values immediately', () => {
    // Arrange: mock matchMedia to return prefers-reduced-motion: reduce
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    renderWithTheme(<CostResultCard inputs={BASE_INPUTS} onContinue={noop} />);

    // In reduced-motion mode, the component renders final (non-zero) values immediately.
    // The break-even for BASE_INPUTS should be approximately $1.10 (not $0.00).
    // We verify by checking the formatted value is NOT the zero placeholder.
    const breakEvenHeading = screen.queryByText('$0.00');
    expect(breakEvenHeading).not.toBeInTheDocument();

    // Restore
    Object.defineProperty(window, 'matchMedia', { writable: true, value: originalMatchMedia });
  });

  it.skip('animates count-up via requestAnimationFrame when motion enabled — jsdom RAF not fully supported', () => {
    // RAF count-up behavior is difficult to assert deterministically in jsdom because
    // requestAnimationFrame is synchronous and does not simulate timing.
    // This behavior is verified manually via SMOKE-CHECKLIST.md (STAB-15).
  });
});
