import { ThemeMode, ThemeDirection } from '../../types/config';
import { CustomShadowProps } from '../../types/theme';
/**
 * Mock custom shadows for testing
 */
export declare const mockCustomShadows: CustomShadowProps;
/**
 * Mock theme configuration for testing
 */
export declare const mockThemeConfig: {
    mode: ThemeMode;
    presetColor: "default";
    themeDirection: ThemeDirection;
    fontFamily: "'Public Sans', sans-serif";
};
/**
 * Creates a mock theme object for testing components that need theme access
 */
export declare const createMockTheme: (overrides?: {}) => {
    palette: {
        mode: string;
        primary: {
            main: string;
            light: string;
            dark: string;
            contrastText: string;
        };
        secondary: {
            main: string;
            light: string;
            dark: string;
            contrastText: string;
        };
        error: {
            main: string;
            light: string;
            dark: string;
        };
        warning: {
            main: string;
            light: string;
            dark: string;
        };
        info: {
            main: string;
            light: string;
            dark: string;
        };
        success: {
            main: string;
            light: string;
            dark: string;
        };
        grey: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
        };
        divider: string;
        background: {
            paper: string;
            default: string;
        };
    };
    customShadows: CustomShadowProps;
    shadows: string[];
};
//# sourceMappingURL=mockTheme.d.ts.map