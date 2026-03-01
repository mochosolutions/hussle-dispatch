import { default as React } from 'react';
import { FormStructure } from '../DynamicForm/types';
interface FormDialogProps<T> {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog closes */
    onClose?: () => void;
    /** Callback when form is submitted */
    onSubmit: (values: T) => void;
    /** Yup validation schema */
    validationSchema: any;
    /** Initial form values */
    initialValues: any;
    /** Form field structure configuration */
    structure: FormStructure;
    /** Submit button text */
    actionTitle: string;
    /** Dialog title */
    dialogTitle: string;
    /** Whether form is submitting */
    isLoading?: boolean;
}
declare const FormDialog: React.FC<FormDialogProps<any>>;
export default FormDialog;
//# sourceMappingURL=index.d.ts.map