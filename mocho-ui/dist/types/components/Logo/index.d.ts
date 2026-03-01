import { default as React } from 'react';
import { SxProps, Theme } from '@mui/material';
export interface LogoProps {
    /** Image source URL */
    src?: string;
    /** Alt text for the image */
    alt?: string;
    /** Width of the logo */
    width?: number | string;
    /** Height of the logo */
    height?: number | string;
    /** Text to display as fallback or alongside logo */
    text?: string;
    /** Whether to show text only (no image) */
    textOnly?: boolean;
    /** Link to navigate to when clicked */
    to?: string;
    /** Whether this is the mini/collapsed version */
    isIcon?: boolean;
    /** Use reversed/light version of logo (for dark backgrounds) */
    reverse?: boolean;
    /** Custom styles */
    sx?: SxProps<Theme>;
}
/**
 * Logo - Configurable logo component
 *
 * Can display:
 * - Image logo
 * - Text logo
 * - Image + text
 * - Mini/icon version for collapsed sidebars
 */
export declare const Logo: React.FC<LogoProps>;
export default Logo;
//# sourceMappingURL=index.d.ts.map