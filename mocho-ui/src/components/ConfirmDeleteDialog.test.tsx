import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('ConfirmDeleteDialog', () => {
  const defaultProps = {
    open: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders default title', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} />);

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} title="Delete User" />);

      expect(screen.getByText('Delete User')).toBeInTheDocument();
    });

    it('renders default message', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} />);

      expect(
        screen.getByText('Are you sure you want to delete this item? This action cannot be undone.')
      ).toBeInTheDocument();
    });

    it('renders custom message', () => {
      renderWithTheme(
        <ConfirmDeleteDialog {...defaultProps} message="This will permanently remove the user." />
      );

      expect(screen.getByText('This will permanently remove the user.')).toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('renders default confirm button label', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('renders default cancel button label', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders custom confirm label', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} confirmLabel="Remove" />);

      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('renders custom cancel label', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} cancelLabel="Keep" />);

      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('visual elements', () => {
    it('renders warning icon', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} />);

      expect(screen.getByTestId('WarningAmberIcon')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct aria-labelledby', () => {
      renderWithTheme(<ConfirmDeleteDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-delete-dialog-title');
    });
  });
});
