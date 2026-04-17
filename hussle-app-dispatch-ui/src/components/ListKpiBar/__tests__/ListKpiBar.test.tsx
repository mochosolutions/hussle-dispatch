import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ListKpiBar from '../index';
import type { KpiItem } from '../index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ListKpiBar', () => {
  it('renders correct number of KPI items', () => {
    const items: KpiItem[] = [
      { label: 'Total', value: 10 },
      { label: 'Active', value: 5 },
      { label: 'Pending', value: 3 },
      { label: 'Inactive', value: 2 },
    ];

    renderWithTheme(<ListKpiBar items={items} />);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders label, value, and subtitle', () => {
    const items: KpiItem[] = [
      { label: 'Revenue', value: '$12,500', subtitle: 'This month' },
    ];

    renderWithTheme(<ListKpiBar items={items} />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,500')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('handles missing subtitle', () => {
    const items: KpiItem[] = [
      { label: 'Count', value: 42 },
    ];

    renderWithTheme(<ListKpiBar items={items} />);

    expect(screen.getByText('Count')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders 3 items', () => {
    const items: KpiItem[] = [
      { label: 'Alpha', value: 1 },
      { label: 'Beta', value: 2 },
      { label: 'Gamma', value: 3 },
    ];

    renderWithTheme(<ListKpiBar items={items} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders 6 items', () => {
    const items: KpiItem[] = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
      { label: 'Three', value: 3 },
      { label: 'Four', value: 4 },
      { label: 'Five', value: 5 },
      { label: 'Six', value: 6 },
    ];

    renderWithTheme(<ListKpiBar items={items} />);

    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
    expect(screen.getByText('Four')).toBeInTheDocument();
    expect(screen.getByText('Five')).toBeInTheDocument();
    expect(screen.getByText('Six')).toBeInTheDocument();
  });
});
