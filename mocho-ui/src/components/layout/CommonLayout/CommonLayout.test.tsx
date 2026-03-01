import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Outlet, Routes, Route } from 'react-router-dom';

// Mock the lazy-loaded components
jest.mock('./Header', () => ({
  __esModule: true,
  default: ({ layout }: { layout: string }) => (
    <header data-testid="header">Header - {layout}</header>
  ),
}));

jest.mock('./FooterBlock', () => ({
  __esModule: true,
  default: ({ isFull }: { isFull: boolean }) => (
    <footer data-testid="footer">Footer - {isFull ? 'Full' : 'Simple'}</footer>
  ),
}));

// Mock Loader
jest.mock('../../Loadable/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loading...</div>,
}));

import CommonLayout from './index';

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
            <Route index element={<div data-testid="outlet-content">Outlet Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('CommonLayout', () => {
  describe('blank layout', () => {
    it('renders only outlet with blank layout', () => {
      renderWithProviders(<CommonLayout layout="blank" />);

      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    });

    it('uses blank layout by default', () => {
      renderWithProviders(<CommonLayout />);

      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    });
  });

  describe('landing layout', () => {
    it('renders header, outlet, and full footer with landing layout', async () => {
      renderWithProviders(<CommonLayout layout="landing" />);

      expect(await screen.findByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByText('Footer - Full')).toBeInTheDocument();
    });

    it('passes landing layout prop to header', async () => {
      renderWithProviders(<CommonLayout layout="landing" />);

      expect(await screen.findByText('Header - landing')).toBeInTheDocument();
    });
  });

  describe('simple layout', () => {
    it('renders header, outlet, and simple footer with simple layout', async () => {
      renderWithProviders(<CommonLayout layout="simple" />);

      expect(await screen.findByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByText('Footer - Simple')).toBeInTheDocument();
    });

    it('passes simple layout prop to header', async () => {
      renderWithProviders(<CommonLayout layout="simple" />);

      expect(await screen.findByText('Header - simple')).toBeInTheDocument();
    });
  });
});
