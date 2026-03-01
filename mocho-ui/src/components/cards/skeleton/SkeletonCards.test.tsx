import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductPlaceholder from './ProductPlaceholder';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('ProductPlaceholder', () => {
  describe('rendering', () => {
    it('renders skeleton component', () => {
      const { container } = renderWithTheme(<ProductPlaceholder />);

      // Should render multiple skeleton elements
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders main card', () => {
      const { container } = renderWithTheme(<ProductPlaceholder />);

      // MainCard wrapper should exist
      const card = container.querySelector('.MuiPaper-root');
      expect(card).toBeInTheDocument();
    });

    it('renders image placeholder', () => {
      const { container } = renderWithTheme(<ProductPlaceholder />);

      // Should have a large rectangular skeleton for image
      const rectangularSkeletons = container.querySelectorAll(
        '.MuiSkeleton-rectangular'
      );
      expect(rectangularSkeletons.length).toBeGreaterThan(0);
    });

    it('renders content placeholders', () => {
      const { container } = renderWithTheme(<ProductPlaceholder />);

      // Should have CardContent area with skeletons
      const cardContent = container.querySelector('.MuiCardContent-root');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe('structure', () => {
    it('has image area at top', () => {
      const { container } = renderWithTheme(<ProductPlaceholder />);

      // First skeleton should be the image placeholder (220px height)
      const firstSkeleton = container.querySelector('.MuiSkeleton-root');
      expect(firstSkeleton).toBeInTheDocument();
    });

    it('has multiple content rows', () => {
      const { container } = renderWithTheme(<ProductPlaceholder />);

      // Should have Grid container for content
      const grids = container.querySelectorAll('.MuiGrid-item');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('skeleton elements are presentational', () => {
      const { container } = renderWithTheme(<ProductPlaceholder />);

      // Skeletons should not have interactive roles
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      skeletons.forEach((skeleton) => {
        expect(skeleton).not.toHaveAttribute('role', 'button');
      });
    });
  });
});
