import { FormHandle, FormState, FormStateChangeCallback } from '../types/form';
/**
 * Return type for useFormRef hook
 */
export interface UseFormRefReturn<T extends FormHandle = FormHandle> {
    /** Ref to pass to form component's ref prop */
    formRef: React.RefObject<T>;
    /** Current form state (synced via onStateChange callback) */
    formState: FormState;
    /** Memoized callback to pass to form's onStateChange prop */
    handleFormStateChange: FormStateChangeCallback;
    /** Convenience method to trigger form submission via ref */
    submitForm: () => void;
    /** Convenience method to reset form via ref */
    resetForm: () => void;
    /** Whether the save button should be disabled */
    isSaveDisabled: boolean;
    /** Button text based on submitting state */
    saveButtonText: (defaultText: string, submittingText?: string) => string;
}
/**
 * Hook to manage form refs for external form submission.
 *
 * This hook solves the problem of submit buttons located outside the form element
 * (e.g., in PageHeader) by providing a ref-based submission pattern.
 *
 * @example
 * ```tsx
 * const MyPage = () => {
 *   const { formRef, formState, handleFormStateChange, submitForm, isSaveDisabled } = useFormRef();
 *
 *   const headerActions = (
 *     <Button onClick={submitForm} disabled={isSaveDisabled}>
 *       {formState.isSubmitting ? 'Saving...' : 'Save'}
 *     </Button>
 *   );
 *
 *   return (
 *     <PageWrapper>
 *       <PageHeader headerActions={headerActions} />
 *       <MyForm ref={formRef} onStateChange={handleFormStateChange} />
 *     </PageWrapper>
 *   );
 * };
 * ```
 *
 * @template T - Form handle type (defaults to FormHandle)
 * @returns Object containing formRef, formState, and helper methods
 */
export declare function useFormRef<T extends FormHandle = FormHandle>(): UseFormRefReturn<T>;
export default useFormRef;
//# sourceMappingURL=useFormRef.d.ts.map