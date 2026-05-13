// Wave 0 scaffold — covers STAB-07. PresetTileSelector exists today;
// assertions are real (not placeholders).

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';

import { PresetTileSelector } from 'features/carrier-portal/components/PresetTileSelector';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const presets = [
  { value: 100, label: '$100' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
];

describe('PresetTileSelector', () => {
  it('renders one chip per preset plus a Custom chip — STAB-07', () => {
    // Arrange / Act
    renderWithTheme(<PresetTileSelector presets={presets} value={0} onChange={jest.fn()} />);

    // Assert
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$250')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('calls onChange with the preset value when a chip is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithTheme(<PresetTileSelector presets={presets} value={0} onChange={onChange} />);

    // Act
    await user.click(screen.getByText('$250'));

    // Assert
    expect(onChange).toHaveBeenCalledWith(250);
  });

  it('reveals a custom-value TextField when the Custom chip is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithTheme(<PresetTileSelector presets={presets} value={0} onChange={jest.fn()} />);
    expect(screen.queryByPlaceholderText('Enter amount')).toBeNull();

    // Act
    await user.click(screen.getByText('Custom'));

    // Assert
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });
});
