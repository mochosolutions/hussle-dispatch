import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { store } from 'store';
import DocumentsTab from '../index';

const mockOpenDrawer = jest.fn();

jest.mock('features/ui/hooks/useDrawerActions', () => ({
  useDrawerActions: () => ({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
  }),
}));

jest.mock('features/documents/components/DocumentTable', () => ({
  DocumentTable: ({ entityType, entityId }: { entityType: string; entityId: string }) => (
    <div data-testid="document-table" data-entity-type={entityType} data-entity-id={entityId} />
  ),
}));

const theme = createTheme();

const renderComponent = (props: { entityType: 'driver'; entityId: string; canUpload?: boolean }) =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <DocumentsTab {...props} />
      </ThemeProvider>
    </Provider>,
  );

describe('DocumentsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders DocumentTable with correct props', () => {
    renderComponent({ entityType: 'driver', entityId: 'drv-123' });

    const table = screen.getByTestId('document-table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute('data-entity-type', 'driver');
    expect(table).toHaveAttribute('data-entity-id', 'drv-123');
  });

  it('renders upload button when canUpload is true', () => {
    renderComponent({ entityType: 'driver', entityId: 'drv-123', canUpload: true });

    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('renders upload button by default when canUpload is not specified', () => {
    renderComponent({ entityType: 'driver', entityId: 'drv-123' });

    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('hides upload button when canUpload is false', () => {
    renderComponent({ entityType: 'driver', entityId: 'drv-123', canUpload: false });

    expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument();
  });

  it('opens document upload drawer when upload button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent({ entityType: 'driver', entityId: 'drv-123' });

    await user.click(screen.getByRole('button', { name: /upload/i }));

    expect(mockOpenDrawer).toHaveBeenCalledWith('documentUpload', {
      context: 'driver-detail',
      entityType: 'driver',
      entityId: 'drv-123',
    });
  });
});
