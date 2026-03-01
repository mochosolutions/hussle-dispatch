import { default as React } from 'react';
interface ConfirmDeleteDialogProps {
    open: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}
declare const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps>;
export default ConfirmDeleteDialog;
//# sourceMappingURL=ConfirmDeleteDialog.d.ts.map