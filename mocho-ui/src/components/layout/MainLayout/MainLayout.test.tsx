import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock child components
jest.mock('./Drawer', () => ({
  __esModule: true,
  default: () => <aside data-testid="drawer">Drawer</aside>,
}));

jest.mock('./Header', () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}));

jest.mock('./Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock('../../Loadable/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loading...</div>,
}));

// Mock hooks
jest.mock('../../../hooks/useConfig', () => ({
  __esModule: true,
  default: () => ({
    container: true,
    miniDrawer: false,
    menuOrientation: 'vertical',
  }),
}));

jest.mock('../../../store', () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => ({ drawerOpen: true }),
}));

jest.mock('../LayoutContext', () => ({
  useLayout: () => ({
    isLoading: false,
    loadingMessage: '',
  }),
}));

jest.mock('../../../store/reducers/menu', () => ({
  openDrawer: (open: boolean) => ({ type: 'menu/openDrawer', payload: open }),
}));

import MainLayout from './index';

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={ui}>
            <Route index element={<div data-testid="outlet-content">Main Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('MainLayout', () => {
  describe('rendering', () => {
    it('renders header', () => {
      renderWithProviders(<MainLayout />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders drawer', () => {
      renderWithProviders(<MainLayout />);

      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('renders outlet content', () => {
      renderWithProviders(<MainLayout />);

      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    });

    it('renders footer', () => {
      renderWithProviders(<MainLayout />);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('structure', () => {
    it('renders all layout sections', () => {
      renderWithProviders(<MainLayout />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('has main content area', () => {
      const { container } = renderWithProviders(<MainLayout />);

      // Should have a main element
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });
  });
});

// Note: Loading state testing requires a separate test file with different mock configuration
// due to Jest's module mocking limitations with React contexts
