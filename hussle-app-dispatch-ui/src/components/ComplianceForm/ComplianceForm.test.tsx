import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { DocumentType } from 'features/documents/types';

import { ComplianceForm } from './index';

const theme = createTheme();

const renderForm = (props: {
  documentType: DocumentType;
  onSubmit?: jest.Mock;
  onCancel?: jest.Mock;
}) => {
  const onSubmit = props.onSubmit ?? jest.fn();
  const onCancel = props.onCancel ?? jest.fn();
  render(
    <ThemeProvider theme={theme}>
      <ComplianceForm
        documentType={props.documentType}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </ThemeProvider>,
  );
  return { onSubmit, onCancel };
};

describe('ComplianceForm', () => {
  it('renders an Expiration Date input for compliance type', () => {
    renderForm({ documentType: DocumentType.INSURANCE_CERT });
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
  });

  it('disables Upload button when requiresExpiry is true and expiry is empty (INSURANCE_CERT)', () => {
    renderForm({ documentType: DocumentType.INSURANCE_CERT });
    const button = screen.getByRole('button', { name: /upload/i });
    expect(button).toBeDisabled();
  });

  it('enables Upload button after expiry is filled when requiresExpiry is true', async () => {
    const user = userEvent.setup();
    renderForm({ documentType: DocumentType.INSURANCE_CERT });
    const expiry = screen.getByLabelText(/expiration date/i);
    await user.type(expiry, '2030-01-01');
    expect(screen.getByRole('button', { name: /upload/i })).toBeEnabled();
  });

  it('enables Upload button with empty expiry when requiresExpiry is unset (REGISTRATION)', () => {
    renderForm({ documentType: DocumentType.REGISTRATION });
    expect(screen.getByRole('button', { name: /upload/i })).toBeEnabled();
  });

  it('invokes onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm({ documentType: DocumentType.REGISTRATION });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('invokes onSubmit with (expiry, metadata) including metadataFields', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ documentType: DocumentType.INSURANCE_CERT });

    await user.type(screen.getByLabelText(/expiration date/i), '2030-01-01');
    await user.type(screen.getByLabelText(/policy number/i), 'POL-123');
    await user.click(screen.getByRole('button', { name: /upload/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('2030-01-01', { policyNumber: 'POL-123' });
  });
});
