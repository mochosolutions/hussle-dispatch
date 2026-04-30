import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import DocumentsTab from '../index';

const mockOpenDrawer = jest.fn();

jest.mock('features/ui/hooks/useDrawerActions', () => ({
  useDrawerActions: () => ({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
  }),
}));

interface MockDocumentTableProps {
  entityType: string;
  entityId: string;
  onUpload?: () => void;
}

jest.mock('features/documents/components/DocumentTable', () => ({
  DocumentTable: ({ entityType, entityId, onUpload }: MockDocumentTableProps) => (
    <div
      data-testid="document-table"
      data-entity-type={entityType}
      data-entity-id={entityId}
      data-has-on-upload={onUpload ? 'true' : 'false'}
    >
      {onUpload && (
        <button type="button" onClick={onUpload}>
          empty-state-upload
        </button>
      )}
    </div>
  ),
}));

const theme = createTheme();

const renderComponent = (props: { entityType: 'driver'; entityId: string; canUpload?: boolean }) =>
  render(
    <ThemeProvider theme={theme}>
      <DocumentsTab {...props} />
    </ThemeProvider>,
  );

describe('DocumentsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders DocumentTable with the entity props', () => {
    renderComponent({ entityType: 'driver', entityId: 'drv-123' });

    const table = screen.getByTestId('document-table');
    expect(table).toHaveAttribute('data-entity-type', 'driver');
    expect(table).toHaveAttribute('data-entity-id', 'drv-123');
  });

  it('passes onUpload through when canUpload is true (default)', () => {
    renderComponent({ entityType: 'driver', entityId: 'drv-123' });

    expect(screen.getByTestId('document-table')).toHaveAttribute('data-has-on-upload', 'true');
  });

  it('does not pass onUpload when canUpload is false', () => {
    renderComponent({ entityType: 'driver', entityId: 'drv-123', canUpload: false });

    expect(screen.getByTestId('document-table')).toHaveAttribute('data-has-on-upload', 'false');
    expect(screen.queryByRole('button', { name: /^cloud-upload upload$/i })).not.toBeInTheDocument();
  });

  it('renders the header Upload button when canUpload is true', () => {
    renderComponent({ entityType: 'driver', entityId: 'drv-123' });

    expect(screen.getByRole('button', { name: /^cloud-upload upload$/i })).toBeInTheDocument();
  });

  it('opens the document upload drawer when the header Upload button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent({ entityType: 'driver', entityId: 'drv-123' });

    await user.click(screen.getByRole('button', { name: /^cloud-upload upload$/i }));

    expect(mockOpenDrawer).toHaveBeenCalledWith('documentUpload', {
      context: 'driver-detail',
      entityType: 'driver',
      entityId: 'drv-123',
    });
  });

  it('opens the upload drawer through onUpload (empty-state CTA)', async () => {
    const user = userEvent.setup();
    renderComponent({ entityType: 'driver', entityId: 'drv-123' });

    await user.click(screen.getByRole('button', { name: /empty-state-upload/i }));

    expect(mockOpenDrawer).toHaveBeenCalledWith('documentUpload', {
      context: 'driver-detail',
      entityType: 'driver',
      entityId: 'drv-123',
    });
  });
});
