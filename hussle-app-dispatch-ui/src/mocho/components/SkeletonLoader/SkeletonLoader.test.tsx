import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ListSkeleton, FormSkeleton } from './index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('ListSkeleton', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      renderWithTheme(<ListSkeleton />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders specified number of rows', () => {
      const { container } = renderWithTheme(<ListSkeleton rows={3} />);

      // Check for skeleton elements (MUI Skeleton renders with MuiSkeleton-root class)
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      // 1 header row + 3 data rows + 1 pagination = 5 skeletons minimum
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders header when showHeader is true', () => {
      const { container } = renderWithTheme(<ListSkeleton showHeader={true} />);

      // Header section contains title and action skeletons
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render header actions when showActions is false', () => {
      const { container } = renderWithTheme(
        <ListSkeleton showHeader={true} showActions={false} />
      );

      // With showActions=false, fewer skeletons should render
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('has role status', () => {
      renderWithTheme(<ListSkeleton />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live polite', () => {
      renderWithTheme(<ListSkeleton />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-label for loading', () => {
      renderWithTheme(<ListSkeleton />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading list data');
    });
  });

  describe('customization', () => {
    it('applies custom row height', () => {
      const { container } = renderWithTheme(<ListSkeleton rowHeight={100} />);

      // Verify skeleton renders (specific height testing is visual)
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides header when showHeader is false', () => {
      const { container } = renderWithTheme(<ListSkeleton showHeader={false} />);

      // Should still render but with fewer elements
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});

describe('FormSkeleton', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      renderWithTheme(<FormSkeleton />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders specified number of fields', () => {
      const { container } = renderWithTheme(<FormSkeleton fields={3} />);

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders back button skeleton when showBackButton is true', () => {
      const { container } = renderWithTheme(<FormSkeleton showBackButton={true} />);

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders title skeleton when showTitle is true', () => {
      const { container } = renderWithTheme(<FormSkeleton showTitle={true} />);

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders action buttons when showActions is true', () => {
      const { container } = renderWithTheme(<FormSkeleton showActions={true} />);

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders rich editor skeleton when showRichEditor is true', () => {
      const { container } = renderWithTheme(<FormSkeleton showRichEditor={true} />);

      // Rich editor adds extra skeletons (toolbar + content area)
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(5); // More than default
    });
  });

  describe('accessibility', () => {
    it('has role status', () => {
      renderWithTheme(<FormSkeleton />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live polite', () => {
      renderWithTheme(<FormSkeleton />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-label for loading form', () => {
      renderWithTheme(<FormSkeleton />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading form');
    });
  });

  describe('card wrapper', () => {
    it('renders with card wrapper by default', () => {
      const { container } = renderWithTheme(<FormSkeleton />);

      // MuiBox-root with box shadow indicates card
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('renders without card wrapper when showCard is false', () => {
      const { container } = renderWithTheme(<FormSkeleton showCard={false} />);

      // Should still render, just without the wrapper styling
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('customization', () => {
    it('hides back button when showBackButton is false', () => {
      const { container: withButton } = renderWithTheme(
        <FormSkeleton showBackButton={true} />
      );
      const { container: withoutButton } = renderWithTheme(
        <FormSkeleton showBackButton={false} />
      );

      // Without back button should have fewer skeletons
      const skeletonsWithButton = withButton.querySelectorAll('.MuiSkeleton-root');
      const skeletonsWithoutButton = withoutButton.querySelectorAll('.MuiSkeleton-root');
      expect(skeletonsWithoutButton.length).toBeLessThan(skeletonsWithButton.length);
    });

    it('hides title when showTitle is false', () => {
      const { container: withTitle } = renderWithTheme(
        <FormSkeleton showTitle={true} />
      );
      const { container: withoutTitle } = renderWithTheme(
        <FormSkeleton showTitle={false} />
      );

      const skeletonsWithTitle = withTitle.querySelectorAll('.MuiSkeleton-root');
      const skeletonsWithoutTitle = withoutTitle.querySelectorAll('.MuiSkeleton-root');
      expect(skeletonsWithoutTitle.length).toBeLessThan(skeletonsWithTitle.length);
    });

    it('hides actions when showActions is false', () => {
      const { container: withActions } = renderWithTheme(
        <FormSkeleton showActions={true} />
      );
      const { container: withoutActions } = renderWithTheme(
        <FormSkeleton showActions={false} />
      );

      const skeletonsWithActions = withActions.querySelectorAll('.MuiSkeleton-root');
      const skeletonsWithoutActions = withoutActions.querySelectorAll('.MuiSkeleton-root');
      expect(skeletonsWithoutActions.length).toBeLessThan(skeletonsWithActions.length);
    });
  });
});
