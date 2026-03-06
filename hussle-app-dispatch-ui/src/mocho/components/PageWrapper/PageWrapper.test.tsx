import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PageWrapper } from './index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('PageWrapper', () => {
  describe('rendering', () => {
    it('renders children when not loading', () => {
      renderWithTheme(
        <PageWrapper>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });

    it('renders loading spinner when isLoading is true', () => {
      renderWithTheme(
        <PageWrapper isLoading>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Page Content')).not.toBeInTheDocument();
    });

    it('renders custom loading component', () => {
      renderWithTheme(
        <PageWrapper isLoading loadingComponent={<div>Custom Loading...</div>}>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders default error message when isError is true', () => {
      renderWithTheme(
        <PageWrapper isError>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
      expect(screen.queryByText('Page Content')).not.toBeInTheDocument();
    });

    it('renders custom error component', () => {
      renderWithTheme(
        <PageWrapper isError errorComponent={<div>Custom Error Message</div>}>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
    });

    it('loading takes precedence over error', () => {
      renderWithTheme(
        <PageWrapper isLoading isError>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders default empty message when isEmpty is true', () => {
      renderWithTheme(
        <PageWrapper isEmpty>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByText('No data found.')).toBeInTheDocument();
      expect(screen.queryByText('Page Content')).not.toBeInTheDocument();
    });

    it('renders custom empty component', () => {
      renderWithTheme(
        <PageWrapper isEmpty emptyComponent={<div>No items available</div>}>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('loading takes precedence over empty', () => {
      renderWithTheme(
        <PageWrapper isLoading isEmpty>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('No data found.')).not.toBeInTheDocument();
    });

    it('error takes precedence over empty', () => {
      renderWithTheme(
        <PageWrapper isError isEmpty>
          <div>Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
      expect(screen.queryByText('No data found.')).not.toBeInTheDocument();
    });
  });

  describe('error boundary', () => {
    // Suppress console.error for these tests
    const originalConsoleError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalConsoleError;
    });

    const BuggyComponent = () => {
      throw new Error('Test error');
    };

    it('catches errors and displays fallback', () => {
      renderWithTheme(
        <PageWrapper>
          <BuggyComponent />
        </PageWrapper>
      );

      expect(
        screen.getByText('This page failed to load. Please try refreshing the page.')
      ).toBeInTheDocument();
    });

    it('calls onBoundaryError when error occurs', () => {
      const onBoundaryError = jest.fn();

      renderWithTheme(
        <PageWrapper onBoundaryError={onBoundaryError}>
          <BuggyComponent />
        </PageWrapper>
      );

      expect(onBoundaryError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('state priority', () => {
    it('priority order: loading > error > empty > content', () => {
      // All states true
      const { rerender } = renderWithTheme(
        <PageWrapper isLoading isError isEmpty>
          <div>Content</div>
        </PageWrapper>
      );
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Remove loading
      rerender(
        <ThemeProvider theme={theme}>
          <PageWrapper isError isEmpty>
            <div>Content</div>
          </PageWrapper>
        </ThemeProvider>
      );
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();

      // Remove error
      rerender(
        <ThemeProvider theme={theme}>
          <PageWrapper isEmpty>
            <div>Content</div>
          </PageWrapper>
        </ThemeProvider>
      );
      expect(screen.getByText('No data found.')).toBeInTheDocument();

      // Remove empty
      rerender(
        <ThemeProvider theme={theme}>
          <PageWrapper>
            <div>Content</div>
          </PageWrapper>
        </ThemeProvider>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
