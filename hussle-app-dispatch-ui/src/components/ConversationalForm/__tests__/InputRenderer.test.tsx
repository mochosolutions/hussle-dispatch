// Wave 0 scaffold — covers STAB-12. The `stateGrid` route is wired today;
// the `presetTiles` route currently renders a placeholder stub and only
// becomes a real PresetTileSelector route in Plan 04 (STAB-12 routing).

import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import { InputRenderer } from '../InputRenderer';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('InputRenderer routing', () => {
  it('routes inputType="stateGrid" to StateGrid — STAB-12', () => {
    // Arrange / Act
    renderWithTheme(
      <InputRenderer
        inputType="stateGrid"
        value={{}}
        onChange={jest.fn()}
      />,
    );

    // Assert — StateGrid's legend ("Neutral"/"Preferred"/"Avoided") is the cheapest signature.
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Preferred')).toBeInTheDocument();
    expect(screen.getByText('Avoided')).toBeInTheDocument();
    // And it renders at least one of the state tiles.
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it.todo('routes inputType="presetTiles" to PresetTileSelector — STAB-12');
});
