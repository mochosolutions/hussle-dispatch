import React from 'react';
import { render, screen, userEvent } from '../../../__tests__/test-utils';
import EmptyState from '../index';

describe('EmptyState', () => {
  describe('rendering', () => {
    it('renders with default custom variant', () => {
      render(<EmptyState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('No Data')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      render(<EmptyState title="Nothing here" />);

      expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });

    it('renders custom message', () => {
      render(<EmptyState message="This is a custom message" />);

      expect(screen.getByText('This is a custom message')).toBeInTheDocument();
    });

    it('renders emoji icon when string provided', () => {
      render(<EmptyState icon="📝" title="Test" />);

      expect(screen.getByText('📝')).toBeInTheDocument();
    });
  });

  describe('no-data variant', () => {
    it('renders default no-data variant content', () => {
      render(<EmptyState variant="no-data" />);

      expect(screen.getByText('No Items Yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Get started by creating your first/)
      ).toBeInTheDocument();
    });

    it('uses entityName in title and message', () => {
      render(<EmptyState variant="no-data" entityName="Authors" />);

      expect(screen.getByText('No Authors Yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Get started by creating your first author/)
      ).toBeInTheDocument();
    });

    it('shows Create button with Add icon', () => {
      const handleCreate = jest.fn();
      render(
        <EmptyState
          variant="no-data"
          entityName="Categories"
          onAction={handleCreate}
        />
      );

      const button = screen.getByRole('button', { name: /Create Categor/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('no-results variant', () => {
    it('renders no-results variant content', () => {
      render(<EmptyState variant="no-results" />);

      expect(screen.getByText('No Results Found')).toBeInTheDocument();
      expect(
        screen.getByText(/No items match your current filters/)
      ).toBeInTheDocument();
    });

    it('shows Clear Filters button', () => {
      const handleClear = jest.fn();
      render(<EmptyState variant="no-results" onAction={handleClear} />);

      expect(
        screen.getByRole('button', { name: 'Clear Filters' })
      ).toBeInTheDocument();
    });
  });

  describe('error variant', () => {
    it('renders error variant content', () => {
      render(<EmptyState variant="error" />);

      expect(screen.getByText('Unable to Load Data')).toBeInTheDocument();
      expect(
        screen.getByText(/An error occurred while loading the data/)
      ).toBeInTheDocument();
    });

    it('shows Retry and Go Back buttons when handlers provided', () => {
      const handleRetry = jest.fn();
      const handleGoBack = jest.fn();
      render(
        <EmptyState
          variant="error"
          onAction={handleRetry}
          onSecondaryAction={handleGoBack}
        />
      );

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Go Back' })
      ).toBeInTheDocument();
    });
  });

  describe('loading variant', () => {
    it('renders loading variant content', () => {
      render(<EmptyState variant="loading" />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(
        screen.getByText('Please wait while we load the data.')
      ).toBeInTheDocument();
    });

    it('does not render action buttons', () => {
      render(<EmptyState variant="loading" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('calls onAction when primary button clicked', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();

      render(
        <EmptyState
          title="Test"
          actionText="Click Me"
          onAction={handleAction}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Click Me' }));

      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('calls onSecondaryAction when secondary button clicked', async () => {
      const user = userEvent.setup();
      const handlePrimary = jest.fn();
      const handleSecondary = jest.fn();

      render(
        <EmptyState
          title="Test"
          actionText="Primary"
          onAction={handlePrimary}
          secondaryActionText="Secondary"
          onSecondaryAction={handleSecondary}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Secondary' }));

      expect(handleSecondary).toHaveBeenCalledTimes(1);
      expect(handlePrimary).not.toHaveBeenCalled();
    });

    it('does not render button when actionText provided without onAction', () => {
      render(<EmptyState title="Test" actionText="Click Me" />);

      expect(
        screen.queryByRole('button', { name: 'Click Me' })
      ).not.toBeInTheDocument();
    });

    it('does not render button when onAction provided without actionText', () => {
      render(<EmptyState title="Test" onAction={() => {}} />);

      // variant=custom has no default actionText
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has status role for screen readers', () => {
      render(<EmptyState title="Test" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live polite for dynamic updates', () => {
      render(<EmptyState title="Test" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('renders buttons that are accessible', () => {
      render(
        <EmptyState
          title="Test"
          actionText="Create Item"
          onAction={() => {}}
        />
      );

      const button = screen.getByRole('button', { name: 'Create Item' });
      expect(button).toBeVisible();
    });
  });

  describe('custom props override variant defaults', () => {
    it('custom title overrides variant title', () => {
      render(<EmptyState variant="no-data" title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('No Items Yet')).not.toBeInTheDocument();
    });

    it('custom message overrides variant message', () => {
      render(<EmptyState variant="error" message="Custom error message" />);

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(
        screen.queryByText(/An error occurred while loading/)
      ).not.toBeInTheDocument();
    });

    it('custom actionText overrides variant actionText', () => {
      render(
        <EmptyState
          variant="no-results"
          actionText="Reset Search"
          onAction={() => {}}
        />
      );

      expect(
        screen.getByRole('button', { name: 'Reset Search' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Clear Filters' })
      ).not.toBeInTheDocument();
    });
  });
});
