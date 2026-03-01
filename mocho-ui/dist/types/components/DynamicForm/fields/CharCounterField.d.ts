import { default as React } from 'react';
import { CharCounterFieldConfig } from '../types';
interface CharCounterFieldProps<TFormValues extends Record<string, any>> {
    field: CharCounterFieldConfig;
    values: TFormValues;
    touched: Partial<Record<keyof TFormValues, boolean>>;
    errors: Partial<Record<keyof TFormValues, string>>;
    handleChange: React.ChangeEventHandler<HTMLInputElement>;
    handleBlur: React.FocusEventHandler<HTMLInputElement>;
}
/**
 * Textarea field with character counter display
 * Shows current character count vs maximum allowed
 */
export declare function CharCounterField<TFormValues extends Record<string, any>>({ field, values, touched, errors, handleChange, handleBlur, }: CharCounterFieldProps<TFormValues>): JSX.Element;
export {};
//# sourceMappingURL=CharCounterField.d.ts.map