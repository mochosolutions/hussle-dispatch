import { default as React } from 'react';
import { FormInputProps, FormStructure } from './types';
/**
 * Renders the appropriate input component based on field type
 * Uses discriminated union types for type-safe field handling
 */
export declare function getFormInput<TFormValues extends Record<string, any>>({ field, values, setFieldValue, touched, errors, handleChange, handleBlur, }: FormInputProps<TFormValues>): JSX.Element;
/**
 * DynamicForm component with full type safety
 * Uses generics to maintain type safety for form values
 * Supports both flat and sectioned layouts with flexible grid system
 *
 * @example
 * ```tsx
 * // Flat layout
 * <DynamicForm<MyFormValues>
 *   structure={{
 *     fields: [
 *       { type: 'input', name: 'name', label: 'Name', grid: { xs: 12, md: 6 } },
 *       { type: 'slug', name: 'slug', label: 'Slug', sourceField: 'name', generator: generateSlug },
 *     ]
 *   }}
 *   values={values}
 *   touched={touched}
 *   errors={errors}
 *   handleChange={handleChange}
 *   handleBlur={handleBlur}
 *   setFieldValue={setFieldValue}
 * />
 *
 * // Sectioned layout with Accordion
 * <DynamicForm<MyFormValues>
 *   structure={{
 *     sections: [
 *       {
 *         title: 'Basic Info',
 *         fields: [...]
 *       },
 *       {
 *         title: 'Advanced',
 *         collapsible: true,
 *         defaultExpanded: false,
 *         fields: [...]
 *       }
 *     ]
 *   }}
 *   ...
 * />
 * ```
 */
declare function DynamicForm<TFormValues extends Record<string, any>>({ structure, values, touched, errors, handleChange, handleBlur, setFieldValue, }: {
    structure: FormStructure;
    values: TFormValues;
    touched: Partial<Record<keyof TFormValues, boolean>>;
    errors: Partial<Record<keyof TFormValues, string>>;
    handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    setFieldValue: <K extends keyof TFormValues>(field: K, value: TFormValues[K]) => void;
}): JSX.Element;
export default DynamicForm;
//# sourceMappingURL=index.d.ts.map