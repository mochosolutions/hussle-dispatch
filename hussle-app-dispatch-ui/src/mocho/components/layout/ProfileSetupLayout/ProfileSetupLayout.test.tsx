import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the Header and Footer components
jest.mock('./Header', () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}));

jest.mock('./Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

import ProfileSetupLayout from './index';

const theme = createTheme();

const renderWithProviders = (
  ui: React.ReactElement,
  { route = '/' } = {}
) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/" element={ui}>
            <Route index element={<div data-testid="outlet-content">Profile Setup Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('ProfileSetupLayout', () => {
  describe('rendering', () => {
    it('renders header', () => {
      renderWithProviders(<ProfileSetupLayout />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders outlet content', () => {
      renderWithProviders(<ProfileSetupLayout />);

      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    });

    it('renders footer', () => {
      renderWithProviders(<ProfileSetupLayout />);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('structure', () => {
    it('renders all three sections', () => {
      renderWithProviders(<ProfileSetupLayout />);

      // All main sections should be present
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('main content area has correct element', () => {
      const { container } = renderWithProviders(<ProfileSetupLayout />);

      // Main content should be in a main element
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('main');
    });
  });

  describe('accessibility', () => {
    it('uses semantic HTML structure', () => {
      const { container } = renderWithProviders(<ProfileSetupLayout />);

      // Should have header, main, footer semantic elements
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });
});
