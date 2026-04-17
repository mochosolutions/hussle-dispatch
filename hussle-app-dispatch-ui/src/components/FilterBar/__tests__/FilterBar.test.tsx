import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';

import { FilterBar } from '../FilterBar';
import type {
  SelectFilterConfig,
  MultiChipFilterConfig,
  DateRangeFilterConfig,
  ToggleFilterConfig,
  SearchConfig,
} from '../filterBarTypes';

jest.mock('mocho/components/DebouncedInput', () => {
  const MockDebouncedInput = (props: Record<string, unknown>) => (
    <input
      data-testid="debounced-input"
      placeholder={props.placeholder as string}
      value={props.value as string}
      onChange={() => {}}
    />
  );
  MockDebouncedInput.displayName = 'MockDebouncedInput';
  return { __esModule: true, default: MockDebouncedInput };
});

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const selectFilter: SelectFilterConfig = {
  type: 'select',
  name: 'status',
  label: 'Status',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  value: 'active',
  onChange: jest.fn(),
};

const multiChipFilter: MultiChipFilterConfig = {
  type: 'multiSelectChip',
  name: 'tags',
  label: 'Tags',
  options: [
    { value: 'urgent', label: 'Urgent' },
    { value: 'normal', label: 'Normal' },
  ],
  value: ['urgent'],
  onChange: jest.fn(),
};

const dateRangeFilter: DateRangeFilterConfig = {
  type: 'dateRange',
  name: 'dateRange',
  label: 'Date Range',
  from: null,
  to: null,
  onChange: jest.fn(),
};

const toggleFilter: ToggleFilterConfig = {
  type: 'toggle',
  name: 'showArchived',
  label: 'Show Archived',
  checked: false,
  onChange: jest.fn(),
};

const searchConfig: SearchConfig = {
  placeholder: 'Search items...',
  value: '',
  onChange: jest.fn(),
};

describe('FilterBar', () => {
  it('renders select filter with options', async () => {
    const user = userEvent.setup();
    renderWithTheme(<FilterBar filters={[selectFilter]} />);

    expect(screen.getByText('Status')).toBeInTheDocument();

    // Open the select dropdown
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Verify options in the dropdown
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Active')).toBeInTheDocument();
    expect(within(listbox).getByText('Inactive')).toBeInTheDocument();
  });

  it('renders multi-chip filter', () => {
    renderWithTheme(<FilterBar filters={[multiChipFilter]} />);

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('renders date range filter', () => {
    renderWithTheme(<FilterBar filters={[dateRangeFilter]} />);

    expect(screen.getByText('Date Range')).toBeInTheDocument();

    const fromInput = screen.getByLabelText('Date Range from');
    const toInput = screen.getByLabelText('Date Range to');
    expect(fromInput).toBeInTheDocument();
    expect(toInput).toBeInTheDocument();
  });

  it('renders toggle filter', () => {
    renderWithTheme(<FilterBar filters={[toggleFilter]} />);

    expect(screen.getByText('Show Archived')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithTheme(<FilterBar filters={[]} search={searchConfig} />);

    const input = screen.getByPlaceholderText('Search items...');
    expect(input).toBeInTheDocument();
  });

  it('renders all filter types together', () => {
    renderWithTheme(
      <FilterBar
        filters={[selectFilter, multiChipFilter, dateRangeFilter, toggleFilter]}
        search={searchConfig}
      />,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Show Archived')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
  });

  it('calls onChange when select value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const filter: SelectFilterConfig = { ...selectFilter, onChange: handleChange };

    renderWithTheme(<FilterBar filters={[filter]} />);

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByText('Inactive'));

    expect(handleChange).toHaveBeenCalledWith('inactive');
  });
});
