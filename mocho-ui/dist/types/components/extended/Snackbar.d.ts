export interface SnackbarProps {
    /** Whether the snackbar is open */
    open: boolean;
    /** The message to display */
    message: string;
    /** Snackbar variant */
    variant?: 'default' | 'alert';
    /** Auto hide duration in milliseconds (default: 6000) */
    autoHideDuration?: number;
    /** Anchor position */
    anchorOrigin?: {
        vertical: 'top' | 'bottom';
        horizontal: 'left' | 'center' | 'right';
    };
    /** Transition animation */
    transition?: 'SlideLeft' | 'SlideUp' | 'SlideRight' | 'SlideDown' | 'Grow' | 'Fade';
    /** Show action button */
    actionButton?: boolean;
    /** Show close button */
    close?: boolean;
    /** Alert configuration (for variant='alert') */
    alert?: {
        variant?: 'filled' | 'outlined' | 'standard';
        color?: 'success' | 'error' | 'warning' | 'info';
    };
    /** Callback when snackbar closes */
    onClose: () => void;
}
declare const Snackbar: ({ open, message, variant, autoHideDuration, anchorOrigin, transition, actionButton, close, alert, onClose, }: SnackbarProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export default Snackbar;
//# sourceMappingURL=Snackbar.d.ts.map