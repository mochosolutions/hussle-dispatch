/**
 * Form Skeleton Props
 */
export interface FormSkeletonProps {
    /**
     * Number of form fields to display
     * @default 5
     */
    fields?: number;
    /**
     * Show back button skeleton
     * @default true
     */
    showBackButton?: boolean;
    /**
     * Show form title skeleton
     * @default true
     */
    showTitle?: boolean;
    /**
     * Show action buttons (Submit, Cancel) skeleton
     * @default true
     */
    showActions?: boolean;
    /**
     * Show rich text editor skeleton
     * @default false
     */
    showRichEditor?: boolean;
    /**
     * Spacing between form fields
     * @default 3
     */
    fieldSpacing?: number;
    /**
     * Wrap form in card
     * @default true
     */
    showCard?: boolean;
}
/**
 * Form Skeleton Component
 * Displays a skeleton loader for form views (Create/Edit pages)
 *
 * @example
 * {isLoading && <FormSkeleton fields={8} />}
 *
 * @example
 * <FormSkeleton
 *   fields={5}
 *   showTitle={true}
 *   showBackButton={true}
 *   showRichEditor={true}
 * />
 */
export declare function FormSkeleton({ fields, showBackButton, showTitle, showActions, showRichEditor, fieldSpacing, showCard, }: FormSkeletonProps): JSX.Element;
export default FormSkeleton;
//# sourceMappingURL=FormSkeleton.d.ts.map