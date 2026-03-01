/**
 * Shared form types for ref-based form submission pattern.
 *
 * This module provides standardized interfaces for forms that support
 * external submission via refs (e.g., submit buttons in PageHeader).
 */
/**
 * Generic form handle interface for ref-based form submission.
 * All form components using forwardRef + useImperativeHandle should implement this.
 */
export interface FormHandle {
    /** Triggers form validation and submission */
    submit: () => Promise<void>;
    /** Resets form to initial values */
    reset: () => void;
    /** Current submitting state from Formik */
    isSubmitting: boolean;
    /** Current validation state from Formik */
    isValid: boolean;
    /** Whether form has unsaved changes */
    isDirty: boolean;
}
/**
 * Form state exposed to parent components.
 * Used for conditional rendering of buttons and dirty form blocking.
 */
export interface FormState {
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;
}
/**
 * Callback type for form state changes
 */
export type FormStateChangeCallback = (state: FormState) => void;
//# sourceMappingURL=form.d.ts.map