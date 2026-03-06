import { ThemeMode, ThemeDirection } from '../../types/config';
import type { CustomShadowProps } from '../../types/theme';

/**
 * Mock custom shadows for testing
 */
export const mockCustomShadows: CustomShadowProps = {
  button: '0 2px 4px rgba(0,0,0,0.1)',
  text: '0 1px 2px rgba(0,0,0,0.1)',
  z1: '0 1px 3px rgba(0,0,0,0.12)',
  primary: '0 4px 8px rgba(25, 118, 210, 0.25)',
  secondary: '0 4px 8px rgba(156, 39, 176, 0.25)',
  error: '0 4px 8px rgba(244, 67, 54, 0.25)',
  warning: '0 4px 8px rgba(255, 152, 0, 0.25)',
  info: '0 4px 8px rgba(33, 150, 243, 0.25)',
  success: '0 4px 8px rgba(76, 175, 80, 0.25)',
  grey: '0 4px 8px rgba(158, 158, 158, 0.25)',
  greyButton: '0 4px 8px rgba(158, 158, 158, 0.4)',
  primaryButton: '0 4px 8px rgba(25, 118, 210, 0.4)',
  secondaryButton: '0 4px 8px rgba(156, 39, 176, 0.4)',
  errorButton: '0 4px 8px rgba(244, 67, 54, 0.4)',
  warningButton: '0 4px 8px rgba(255, 152, 0, 0.4)',
  infoButton: '0 4px 8px rgba(33, 150, 243, 0.4)',
  successButton: '0 4px 8px rgba(76, 175, 80, 0.4)',
};

/**
 * Mock theme configuration for testing
 */
export const mockThemeConfig = {
  mode: ThemeMode.LIGHT,
  presetColor: 'default' as const,
  themeDirection: ThemeDirection.LTR,
  fontFamily: `'Public Sans', sans-serif` as const,
};

/**
 * Creates a mock theme object for testing components that need theme access
 */
export const createMockTheme = (overrides = {}) => ({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#fff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    background: {
      paper: '#fff',
      default: '#fff',
    },
  },
  customShadows: mockCustomShadows,
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.12)',
    '0px 1px 5px rgba(0,0,0,0.12)',
    '0px 1px 8px rgba(0,0,0,0.12)',
    '0px 2px 4px rgba(0,0,0,0.12)',
    '0px 3px 5px rgba(0,0,0,0.12)',
    '0px 3px 5px rgba(0,0,0,0.12)',
    '0px 4px 5px rgba(0,0,0,0.12)',
    '0px 5px 5px rgba(0,0,0,0.12)',
    '0px 5px 6px rgba(0,0,0,0.12)',
    '0px 6px 6px rgba(0,0,0,0.12)',
    '0px 6px 7px rgba(0,0,0,0.12)',
    '0px 7px 8px rgba(0,0,0,0.12)',
    '0px 7px 8px rgba(0,0,0,0.12)',
    '0px 7px 9px rgba(0,0,0,0.12)',
    '0px 8px 9px rgba(0,0,0,0.12)',
    '0px 8px 10px rgba(0,0,0,0.12)',
    '0px 8px 11px rgba(0,0,0,0.12)',
    '0px 9px 11px rgba(0,0,0,0.12)',
    '0px 9px 12px rgba(0,0,0,0.12)',
    '0px 10px 13px rgba(0,0,0,0.12)',
    '0px 10px 13px rgba(0,0,0,0.12)',
    '0px 10px 14px rgba(0,0,0,0.12)',
    '0px 11px 14px rgba(0,0,0,0.12)',
    '0px 11px 15px rgba(0,0,0,0.12)',
  ],
  ...overrides,
});
