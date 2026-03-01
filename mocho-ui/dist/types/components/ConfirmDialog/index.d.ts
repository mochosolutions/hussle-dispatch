import { default as React } from 'react';
/**
 * Props for the ConfirmDialog component
 */
export interface ConfirmDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Dialog title */
    title: string;
    /** Dialog message/description */
    message?: string;
    /** Dialog content (alternative to message) */
    content?: string | React.ReactNode;
    /** Label for confirm button (default: "Confirm") */
    confirmLabel?: string;
    confirmText?: string;
    /** Label for cancel button (default: "Cancel") */
    cancelLabel?: string;
    cancelText?: string;
    /** Severity level that determines icon and color (default: "warning") */
    severity?: 'error' | 'warning' | 'info';
    /** Callback when user confirms */
    onConfirm: () => void;
    /** Callback when dialog closes */
    onClose: () => void;
}
/**
 * Generic Confirmation Dialog Component
 *
 * A reusable confirmation dialog that supports different severity levels
 * and callback-based confirmation handling.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Delete Item"
 *   content="Are you sure you want to delete this item?"
 *   confirmText="Delete"
 *   severity="error"
 *   onConfirm={() => {
 *     deleteItem();
 *     setOpen(false);
 *   }}
 * />
 * ```
 */
declare const ConfirmDialog: React.FC<ConfirmDialogProps>;
export default ConfirmDialog;
//# sourceMappingURL=index.d.ts.map