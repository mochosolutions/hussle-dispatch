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

jest.mock('./Header/HeaderContent/Profile', () => ({
  __esModule: true,
  default: () => <div data-testid="profile">Profile</div>,
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

jest.mock('../../../hooks/useLayoutState', () => ({
  __esModule: true,
  default: () => ({
    drawerOpen: true,
    onDrawerToggle: jest.fn(),
    onDrawerClose: jest.fn(),
  }),
}));

jest.mock('../../../contexts/LayoutStateContext', () => ({
  LayoutStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import MainLayout from './index';
import MainContent from './MainContent';
import LayoutShell from './LayoutShell';

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

describe('MainContent', () => {
  const renderMainContent = (props: Partial<React.ComponentProps<typeof MainContent>> = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <MainContent {...props}>
            <div data-testid="main-children">Content</div>
          </MainContent>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders children', () => {
    renderMainContent();

    expect(screen.getByTestId('main-children')).toBeInTheDocument();
  });

  it('renders a main element', () => {
    const { container } = renderMainContent();

    expect(container.querySelector('main')).toBeInTheDocument();
  });

  it('renders toolbar spacer by default', () => {
    const { container } = renderMainContent();

    // Toolbar spacer is rendered inside main
    const toolbars = container.querySelectorAll('.MuiToolbar-root');
    expect(toolbars.length).toBeGreaterThanOrEqual(1);
  });

  it('hides toolbar spacer when showToolbarSpacer is false', () => {
    const { container } = renderMainContent({ showToolbarSpacer: false });

    const main = container.querySelector('main');
    const toolbars = main?.querySelectorAll('.MuiToolbar-root') ?? [];
    expect(toolbars.length).toBe(0);
  });
});

describe('LayoutShell', () => {
  it('renders children in a flex container', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <LayoutShell>
          <div data-testid="shell-child">Child</div>
        </LayoutShell>
      </ThemeProvider>
    );

    expect(screen.getByTestId('shell-child')).toBeInTheDocument();
    const shellBox = container.firstChild as HTMLElement;
    expect(shellBox).toHaveStyle({ display: 'flex', width: '100%' });
  });
});
