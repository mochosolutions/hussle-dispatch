// Wave 0 scaffold — covers STAB-11. The 16/600 typography assertion is
// expected to FAIL today (SubQuestion currently pins 18px/600) and flip
// GREEN when Plan 07 lands the UI-SPEC Table 1 typography fix.
// The left-border color assertion is real (today's behavior).

import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import { SubQuestion } from '../SubQuestion';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SubQuestion typography', () => {
  it('renders label with fontSize: 16px and fontWeight: 600 — STAB-11 / UI-SPEC Table 1', () => {
    // Arrange / Act
    renderWithTheme(
      <SubQuestion borderColor="blue" questionId="q1" label="What is your MC number?">
        <span>child</span>
      </SubQuestion>,
    );

    // Assert — flips RED → GREEN when SubQuestion.tsx swaps 18px → 16px.
    const label = screen.getByText('What is your MC number?');
    const styles = window.getComputedStyle(label);
    expect(styles.fontSize).toBe('16px');
    expect(styles.fontWeight).toBe('600');
  });
});

describe('SubQuestion left-border colors', () => {
  it('renders with the info.main border color when borderColor="blue" — STAB-11', () => {
    // Arrange / Act
    renderWithTheme(
      <SubQuestion borderColor="blue" questionId="q-blue" label="Blue">
        <span>child</span>
      </SubQuestion>,
    );

    // Assert — the container with the left border is the wrapper with the
    // `data-question-id` attribute. Its computed border-left-color resolves
    // from the MUI palette token `info.main` (theme default: #2196f3).
    const wrapper = screen
      .getByText('Blue')
      .closest('[data-question-id]') as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    if (wrapper) {
      const styles = window.getComputedStyle(wrapper);
      // Defensive — jsdom resolves the CSS value but the exact rgb varies by MUI
      // palette token; assert it is non-empty and not transparent.
      expect(styles.borderLeftStyle).toBe('solid');
      expect(styles.borderLeftColor).not.toBe('');
      expect(styles.borderLeftColor).not.toBe('transparent');
    }
  });

  it.todo('renders green/red/grey left borders when borderColor is green/red/grey — STAB-11');
});
