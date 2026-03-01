import { default as React } from 'react';
import { Props as SimpleBarProps } from 'simplebar-react';
import { SxProps, Theme } from '@mui/material';
export interface SimpleBarWrapperProps extends Omit<SimpleBarProps, 'style'> {
    /** MUI sx prop for styling */
    sx?: SxProps<Theme>;
    /** Children to render inside scrollable area */
    children: React.ReactNode;
}
/**
 * SimpleBar - Custom scrollbar wrapper using simplebar-react
 *
 * Provides consistent custom scrollbars across browsers
 * with MUI sx prop support.
 */
declare const SimpleBar: React.FC<SimpleBarWrapperProps>;
export default SimpleBar;
//# sourceMappingURL=SimpleBar.d.ts.map