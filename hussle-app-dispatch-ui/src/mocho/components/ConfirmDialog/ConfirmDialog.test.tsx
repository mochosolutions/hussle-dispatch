import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './index';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Confirm Action',
    content: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders title', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('renders content', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('renders message prop as content', () => {
      renderWithTheme(
        <ConfirmDialog {...defaultProps} message="Message content" content={undefined} />
      );

      expect(screen.getByText('Message content')).toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('renders default confirm and cancel buttons', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders custom confirm label', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} confirmLabel="Delete" />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('renders custom cancel label', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} cancelLabel="Go Back" />);

      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    });

    it('renders confirmText alias', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} confirmText="Yes, delete" />);

      expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    });

    it('renders cancelText alias', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} cancelText="Nevermind" />);

      expect(screen.getByRole('button', { name: 'Nevermind' })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      renderWithTheme(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderWithTheme(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('severity levels', () => {
    it('renders warning icon by default', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('WarningAmberIcon')).toBeInTheDocument();
    });

    it('renders error icon when severity is error', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} severity="error" />);

      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });

    it('renders info icon when severity is info', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} severity="info" />);

      expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct aria attributes', () => {
      renderWithTheme(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-description');
    });
  });
});
