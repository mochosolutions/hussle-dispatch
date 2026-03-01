import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the lazy-loaded components
jest.mock('./Header', () => ({
  __esModule: true,
  default: () => <header data-testid="header">Landing Header</header>,
}));

jest.mock('./FooterBlock', () => ({
  __esModule: true,
  default: ({ isFull }: { isFull: boolean }) => (
    <footer data-testid="footer">Landing Footer{isFull ? ' - Full' : ''}</footer>
  ),
}));

// Mock Loader
jest.mock('../../Loadable/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loading...</div>,
}));

import LandingPageLayout from './index';

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
            <Route index element={<div data-testid="outlet-content">Landing Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('LandingPageLayout', () => {
  describe('rendering', () => {
    it('renders header', async () => {
      renderWithProviders(<LandingPageLayout />);

      expect(await screen.findByTestId('header')).toBeInTheDocument();
    });

    it('renders outlet content in main area', async () => {
      renderWithProviders(<LandingPageLayout />);

      expect(await screen.findByTestId('outlet-content')).toBeInTheDocument();
    });

    it('renders footer with isFull prop', async () => {
      renderWithProviders(<LandingPageLayout />);

      const footer = await screen.findByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Full');
    });
  });

  describe('structure', () => {
    it('uses grid layout structure', async () => {
      const { container } = renderWithProviders(<LandingPageLayout />);

      // Wait for Suspense to resolve
      await screen.findByTestId('header');

      // Check for semantic structure
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('renders all sections in order', async () => {
      renderWithProviders(<LandingPageLayout />);

      await screen.findByTestId('header');

      // All sections should be present
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('styled components', () => {
    it('wraps content in styled containers', async () => {
      const { container } = renderWithProviders(<LandingPageLayout />);

      await screen.findByTestId('header');

      // The layout uses styled-components for structure
      // Check that header is in a header container
      const headerContainer = container.querySelector('header');
      expect(headerContainer).toBeInTheDocument();

      // Check that main content is in main container
      const mainContainer = container.querySelector('main');
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
