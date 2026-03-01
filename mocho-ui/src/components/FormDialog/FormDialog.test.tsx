import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormDialog from './index';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as Yup from 'yup';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('FormDialog', () => {
  const simpleStructure = {
    fields: [
      {
        name: 'name',
        label: 'Name',
        type: 'input' as const,
      },
    ],
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
  });

  const defaultProps = {
    open: true,
    onSubmit: jest.fn(),
    validationSchema,
    initialValues: { name: '' },
    structure: simpleStructure,
    actionTitle: 'Save',
    dialogTitle: 'Add Item',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      renderWithTheme(<FormDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      renderWithTheme(<FormDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog title', () => {
      renderWithTheme(<FormDialog {...defaultProps} />);

      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });

    it('renders action button with correct text', () => {
      renderWithTheme(<FormDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      renderWithTheme(<FormDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('form interaction', () => {
    it('renders form fields from structure', () => {
      renderWithTheme(<FormDialog {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('calls onSubmit with form values when form is submitted', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      renderWithTheme(<FormDialog {...defaultProps} onSubmit={onSubmit} />);

      // Fill in the form - OutlinedInput creates input element
      const input = document.getElementById('name') as HTMLInputElement;
      await user.type(input, 'Test Name');

      // Submit the form
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Test Name' }),
          expect.anything()
        );
      });
    });
  });

  describe('loading state', () => {
    it('disables cancel button when loading', () => {
      renderWithTheme(<FormDialog {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderWithTheme(<FormDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has correct aria-labelledby', () => {
      renderWithTheme(<FormDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'form-dialog-title');
    });
  });
});
