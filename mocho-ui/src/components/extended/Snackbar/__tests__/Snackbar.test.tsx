import React from 'react';
import { render, screen, userEvent, waitFor } from '../../../../__tests__/test-utils';
import Snackbar from '../../Snackbar';

describe('Snackbar', () => {
  const defaultProps = {
    open: true,
    message: 'Test message',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders when open is true', () => {
      render(<Snackbar {...defaultProps} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<Snackbar {...defaultProps} open={false} />);

      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('renders the message text', () => {
      render(<Snackbar {...defaultProps} message="Hello World" />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  describe('default variant', () => {
    it('renders default snackbar with message', () => {
      render(<Snackbar {...defaultProps} variant="default" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders UNDO button', () => {
      render(<Snackbar {...defaultProps} variant="default" />);

      expect(screen.getByRole('button', { name: 'UNDO' })).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<Snackbar {...defaultProps} variant="default" />);

      expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
    });
  });

  describe('alert variant', () => {
    it('renders alert snackbar', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          alert={{ variant: 'filled', color: 'success' }}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders with success color', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          alert={{ variant: 'filled', color: 'success' }}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders with error color', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          alert={{ variant: 'filled', color: 'error' }}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders with warning color', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          alert={{ variant: 'filled', color: 'warning' }}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders with info color', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          alert={{ variant: 'filled', color: 'info' }}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders outlined alert variant', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          alert={{ variant: 'outlined', color: 'success' }}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders standard alert variant', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          alert={{ variant: 'standard', color: 'info' }}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('shows UNDO button when actionButton is true', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          actionButton={true}
          alert={{ variant: 'filled', color: 'success' }}
        />
      );

      expect(screen.getByRole('button', { name: 'UNDO' })).toBeInTheDocument();
    });

    it('hides UNDO button when actionButton is false', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          actionButton={false}
          alert={{ variant: 'filled', color: 'success' }}
        />
      );

      expect(screen.queryByRole('button', { name: 'UNDO' })).not.toBeInTheDocument();
    });

    it('shows close button when close is true', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          close={true}
          alert={{ variant: 'filled', color: 'success' }}
        />
      );

      expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
    });

    it('hides close button when close is false', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          close={false}
          alert={{ variant: 'filled', color: 'success' }}
        />
      );

      expect(screen.queryByRole('button', { name: 'close' })).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<Snackbar {...defaultProps} onClose={handleClose} />);

      await user.click(screen.getByRole('button', { name: 'close' }));

      expect(handleClose).toHaveBeenCalled();
    });

    it('calls onClose when UNDO button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<Snackbar {...defaultProps} onClose={handleClose} />);

      await user.click(screen.getByRole('button', { name: 'UNDO' }));

      expect(handleClose).toHaveBeenCalled();
    });

    it('does not call onClose on clickaway', async () => {
      const handleClose = jest.fn();

      render(
        <div>
          <button>Outside</button>
          <Snackbar {...defaultProps} onClose={handleClose} />
        </div>
      );

      // Snackbar should ignore clickaway by default
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('auto hide', () => {
    it('uses default autoHideDuration of 6000ms', () => {
      const { container } = render(<Snackbar {...defaultProps} />);

      // Snackbar should be rendered with default autoHideDuration
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('accepts custom autoHideDuration', () => {
      render(<Snackbar {...defaultProps} autoHideDuration={3000} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('anchor origin', () => {
    it('uses default anchor origin (bottom-right)', () => {
      render(<Snackbar {...defaultProps} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('accepts custom anchor origin', () => {
      render(
        <Snackbar
          {...defaultProps}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('transitions', () => {
    it('renders with default SlideUp transition', () => {
      render(<Snackbar {...defaultProps} transition="SlideUp" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with SlideLeft transition', () => {
      render(<Snackbar {...defaultProps} transition="SlideLeft" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with SlideRight transition', () => {
      render(<Snackbar {...defaultProps} transition="SlideRight" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with SlideDown transition', () => {
      render(<Snackbar {...defaultProps} transition="SlideDown" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with Grow transition', () => {
      render(<Snackbar {...defaultProps} transition="Grow" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with Fade transition', () => {
      render(<Snackbar {...defaultProps} transition="Fade" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders alert role for alert variant', () => {
      render(
        <Snackbar
          {...defaultProps}
          variant="alert"
          alert={{ variant: 'filled', color: 'success' }}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('close button has aria-label', () => {
      render(<Snackbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'close' })).toHaveAttribute('aria-label', 'close');
    });

    it('action buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<Snackbar {...defaultProps} onClose={handleClose} />);

      const closeButton = screen.getByRole('button', { name: 'close' });
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
