import { ReactNode } from 'react';
import { ThemeMode, ThemeDirection, PresetColor, FontFamily } from '../types/config';
type ThemeCustomizationProps = {
    children: ReactNode;
    mode?: ThemeMode;
    presetColor?: PresetColor;
    themeDirection?: ThemeDirection;
    fontFamily?: FontFamily;
};
export default function ThemeCustomization({ children, mode, presetColor, themeDirection, fontFamily, }: ThemeCustomizationProps): import("@emotion/react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map