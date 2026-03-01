import { default as React } from 'react';
import { SlugFieldConfig } from '../types';
interface SlugFieldProps<TFormValues extends Record<string, any>> {
    field: SlugFieldConfig;
    values: TFormValues;
    touched: Partial<Record<keyof TFormValues, boolean>>;
    errors: Partial<Record<keyof TFormValues, string>>;
    handleChange: React.ChangeEventHandler<HTMLInputElement>;
    handleBlur: React.FocusEventHandler<HTMLInputElement>;
    setFieldValue: <K extends keyof TFormValues>(field: K, value: TFormValues[K]) => void;
}
/**
 * Slug field component with auto-generation from source field
 * Automatically generates URL-friendly slug when source field changes
 * User can still manually edit the slug if needed
 */
export declare function SlugField<TFormValues extends Record<string, any>>({ field, values, touched, errors, handleChange, handleBlur, setFieldValue, }: SlugFieldProps<TFormValues>): JSX.Element;
export {};
//# sourceMappingURL=SlugField.d.ts.map