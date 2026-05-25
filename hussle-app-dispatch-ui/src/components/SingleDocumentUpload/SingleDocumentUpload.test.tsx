import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { DocumentType } from 'features/documents/types';

import { SingleDocumentUpload } from './index';
import type { SingleDocumentUploadProps } from './index';

const theme = createTheme();

type Status = SingleDocumentUploadProps['status'];

interface RenderOptions {
  documentType?: DocumentType;
  status?: Status;
  errorMessage?: string;
  fileName?: string;
  accept?: string;
  maxFileSize?: number;
  onUpload?: jest.Mock;
  onReset?: jest.Mock;
}

const renderComponent = (options: RenderOptions = {}) => {
  const onUpload = options.onUpload ?? jest.fn();
  const onReset = options.onReset ?? jest.fn();
  render(
    <ThemeProvider theme={theme}>
      <SingleDocumentUpload
        documentType={options.documentType ?? DocumentType.BOL_SIGNED}
        status={options.status ?? 'idle'}
        errorMessage={options.errorMessage}
        fileName={options.fileName}
        accept={options.accept}
        maxFileSize={options.maxFileSize}
        onUpload={onUpload}
        onReset={onReset}
      />
    </ThemeProvider>,
  );
  return { onUpload, onReset };
};

const makePdfFile = (name = 'test.pdf'): File =>
  new File(['hello'], name, { type: 'application/pdf' });

describe('SingleDocumentUpload', () => {
  it('renders Upload button in idle state', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('shows LinearProgress and fileName when status is uploading', () => {
    renderComponent({ status: 'uploading', fileName: 'doc.pdf' });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
  });

  it('shows success icon and fileName when status is success', () => {
    renderComponent({ status: 'success', fileName: 'done.pdf' });
    expect(screen.getByText('done.pdf')).toBeInTheDocument();
  });

  it('shows errorMessage and delete-to-retry when status is error', async () => {
    const user = userEvent.setup();
    const { onReset } = renderComponent({
      status: 'error',
      errorMessage: 'Something went wrong',
    });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /remove failed upload/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders internal error and does NOT call onUpload when file exceeds maxFileSize', async () => {
    const user = userEvent.setup();
    const { onUpload } = renderComponent({ maxFileSize: 1024 });
    const big = new File([new Uint8Array(2048)], 'big.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    await user.upload(input, big);
    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByText(/file exceeds/i)).toBeInTheDocument();
  });

  it('renders internal error and does NOT call onUpload when file extension is not in accept', () => {
    const { onUpload } = renderComponent({ accept: '.pdf' });
    const bad = new File(['x'], 'image.gif', { type: 'image/gif' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [bad] } });
    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument();
  });

  it('renders ComplianceForm after valid file pick for a compliance type (INSURANCE_CERT)', async () => {
    const user = userEvent.setup();
    const { onUpload } = renderComponent({ documentType: DocumentType.INSURANCE_CERT });
    const input = screen.getByTestId('file-input');
    await user.upload(input, makePdfFile());
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('invokes onUpload with (file, expiresAt, metadata) when ComplianceForm Submit is clicked', async () => {
    const user = userEvent.setup();
    const { onUpload } = renderComponent({ documentType: DocumentType.INSURANCE_CERT });
    const file = makePdfFile('cert.pdf');
    await user.upload(screen.getByTestId('file-input'), file);

    await user.type(screen.getByLabelText(/expiration date/i), '2030-01-01');
    await user.type(screen.getByLabelText(/policy number/i), 'POL-9');
    await user.click(screen.getByRole('button', { name: /upload/i }));

    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(onUpload).toHaveBeenCalledWith(file, '2030-01-01', { policyNumber: 'POL-9' });
  });

  it('invokes onReset and returns to idle when ComplianceForm Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { onReset } = renderComponent({ documentType: DocumentType.INSURANCE_CERT });
    await user.upload(screen.getByTestId('file-input'), makePdfFile());
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText(/expiration date/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('invokes onUpload immediately with empty expiresAt/metadata for a non-compliance type (BOL_SIGNED)', async () => {
    const user = userEvent.setup();
    const { onUpload } = renderComponent({ documentType: DocumentType.BOL_SIGNED });
    const file = makePdfFile('bol.pdf');
    await user.upload(screen.getByTestId('file-input'), file);

    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(onUpload).toHaveBeenCalledWith(file, '', {});
  });
});
