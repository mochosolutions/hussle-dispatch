import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import { PageHeader } from './index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('PageHeader', () => {
  describe('rendering', () => {
    it('renders title', () => {
      renderWithTheme(<PageHeader title="Dashboard" />);

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });

    it('renders title as h1', () => {
      renderWithTheme(<PageHeader title="Dashboard" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Dashboard');
    });

    it('renders subtitle when provided', () => {
      renderWithTheme(
        <PageHeader title="Dashboard" subtitle="Welcome back" />
      );

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
      renderWithTheme(<PageHeader title="Dashboard" />);

      expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
    });
  });

  describe('back button', () => {
    it('does not render back button by default', () => {
      renderWithTheme(<PageHeader title="Dashboard" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders back button when showBackButton is true', () => {
      renderWithTheme(
        <PageHeader
          title="Edit User"
          showBackButton
          onNavigate={jest.fn()}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not render back button without onNavigate', () => {
      renderWithTheme(
        <PageHeader title="Edit User" showBackButton />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onNavigate when back button is clicked', async () => {
      const user = userEvent.setup();
      const onNavigate = jest.fn();

      renderWithTheme(
        <PageHeader
          title="Edit User"
          showBackButton
          onNavigate={onNavigate}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('header actions', () => {
    it('does not render actions when not provided', () => {
      renderWithTheme(<PageHeader title="Dashboard" />);

      expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    });

    it('renders header actions when provided', () => {
      renderWithTheme(
        <PageHeader
          title="Users"
          headerActions={<Button>Add User</Button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
    });

    it('renders multiple header actions', () => {
      renderWithTheme(
        <PageHeader
          title="Users"
          headerActions={
            <>
              <Button>Cancel</Button>
              <Button>Save</Button>
            </>
          }
        />
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('combined elements', () => {
    it('renders all elements together', () => {
      const onNavigate = jest.fn();

      renderWithTheme(
        <PageHeader
          title="Edit Post"
          subtitle="Update your blog post"
          showBackButton
          onNavigate={onNavigate}
          headerActions={<Button>Save</Button>}
        />
      );

      expect(screen.getByRole('heading', { name: 'Edit Post' })).toBeInTheDocument();
      expect(screen.getByText('Update your blog post')).toBeInTheDocument();
      // Back button + Save button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });
  });

  describe('accessibility', () => {
    it('title is accessible heading', () => {
      renderWithTheme(<PageHeader title="Accessible Title" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('back button is accessible', () => {
      renderWithTheme(
        <PageHeader
          title="Page"
          showBackButton
          onNavigate={jest.fn()}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
