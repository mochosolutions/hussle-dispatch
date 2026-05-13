// Wave 0 scaffold — covers STAB-10. The 3-state cycle (neutral → preferred →
// avoided → neutral) works today; the a11y attrs (role/aria-pressed/aria-label)
// land in Plan 07, so those assertions are `it.todo`.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';

import { StateGrid } from 'features/carrier-portal/components/StateGrid';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('StateGrid — 3-state cycle', () => {
  it('cycles a state from neutral to PREFERRED on first click — STAB-10', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithTheme(<StateGrid value={{}} onChange={onChange} />);

    // Act
    await user.click(screen.getByText('CA'));

    // Assert
    expect(onChange).toHaveBeenCalledWith({ CA: 'PREFERRED' });
  });

  it('cycles from PREFERRED to AVOIDED on the second click', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithTheme(<StateGrid value={{ CA: 'PREFERRED' }} onChange={onChange} />);

    // Act
    await user.click(screen.getByText('CA'));

    // Assert
    expect(onChange).toHaveBeenCalledWith({ CA: 'AVOIDED' });
  });

  it('cycles from AVOIDED back to neutral (key removed) on the third click', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithTheme(<StateGrid value={{ CA: 'AVOIDED' }} onChange={onChange} />);

    // Act
    await user.click(screen.getByText('CA'));

    // Assert — CA key is removed from the value record
    expect(onChange).toHaveBeenCalledWith({});
  });
});

describe('StateGrid — Plan 07 a11y (placeholders)', () => {
  it.todo('each tile exposes role="button" — STAB-10 a11y');
  it.todo('aria-pressed reflects PREFERRED/AVOIDED state — STAB-10 a11y');
  it.todo('aria-label describes the state and its current preference — STAB-10 a11y');
});
