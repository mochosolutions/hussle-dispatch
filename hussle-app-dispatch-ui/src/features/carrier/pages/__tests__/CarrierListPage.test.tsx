import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { store } from 'store';
import CarrierListPage from '../CarrierListPage';

// Mock @mocho/ui/components to avoid styled-components / AG Grid complexity in unit tests
jest.mock('@mocho/ui/components', () => ({
  ActionsCell: () => null,
  ConfirmDeleteDialog: ({ open, title }: { open: boolean; title: string }) =>
    open ? <div>{title}</div> : null,
  ListSkeleton: () => <div data-testid="list-skeleton" />,
  MainCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NewDataGrid: () => <div data-testid="data-grid" />,
  PageHeader: ({ title, headerActions }: { title: string; headerActions?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {headerActions}
    </div>
  ),
  PageWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  // Form dialog components used in CarrierFormDialog
  TextField: () => null,
  SelectField: () => null,
  DateField: () => null,
  CheckboxField: () => null,
  LoadingButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

const renderWithProviders = () =>
  render(
    <MemoryRouter>
      <Provider store={store}>
        <ThemeProvider theme={createTheme()}>
          <CarrierListPage />
        </ThemeProvider>
      </Provider>
    </MemoryRouter>,
  );

describe('CarrierListPage', () => {
  it('renders the page title', () => {
    renderWithProviders();
    expect(screen.getByRole('heading', { name: /carriers/i })).toBeInTheDocument();
  });

  it('renders the add carrier button', () => {
    renderWithProviders();
    expect(screen.getByRole('button', { name: /add carrier/i })).toBeInTheDocument();
  });

  it('renders the data grid', () => {
    renderWithProviders();
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
  });

  it('renders the status filter', () => {
    renderWithProviders();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });
});
