import React from 'react';

/**
 * Grid breakpoint configuration for Material-UI Grid
 * Allows custom column spans at different breakpoints
 */
export interface GridBreakpoints {
  xs?: number;  // 1-12 columns on extra-small screens
  sm?: number;  // 1-12 columns on small screens
  md?: number;  // 1-12 columns on medium screens
  lg?: number;  // 1-12 columns on large screens
  xl?: number;  // 1-12 columns on extra-large screens
}

/**
 * Base field configuration shared by all field types
 */
interface BaseFieldConfig {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  grid?: GridBreakpoints;  // Custom grid layout per field
}

/**
 * Configuration for text input fields
 */
export interface InputFieldConfig extends BaseFieldConfig {
  type: 'input';
  inputType?: 'text' | 'email' | 'url' | 'password' | 'number';
  maxLength?: number;
  minLength?: number;
}

/**
 * Configuration for textarea fields
 */
export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  rows?: number;
  maxLength?: number;
  minLength?: number;
}

/**
 * Configuration for select dropdown fields
 */
export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options: Array<{ value: string; label: string }>;
  multiple?: boolean;
}

/**
 * Configuration for auto-generating slug fields
 * Automatically generates URL-friendly slug from another field
 */
export interface SlugFieldConfig extends BaseFieldConfig {
  type: 'slug';
  sourceField: string;  // Field to generate slug from (e.g., 'title', 'name')
  generator: (value: string) => string;  // Slug generation function
}

/**
 * Configuration for textarea with character counter
 * Shows remaining character count below the textarea
 */
export interface CharCounterFieldConfig extends BaseFieldConfig {
  type: 'charCounter';
  maxLength: number;
  rows?: number;
  minLength?: number;
}

/**
 * Configuration for autocomplete fields (MUI Autocomplete)
 * Supports single and multiple selection
 */
export interface AutocompleteFieldConfig extends BaseFieldConfig {
  type: 'autocomplete';
  options: Array<{ value: string; label: string }>;
  multiple?: boolean;
}

/**
 * Configuration for file upload fields
 * Handles file selection and upload
 */
export interface FileUploadFieldConfig extends BaseFieldConfig {
  type: 'fileUpload';
  accept?: string;  // e.g., 'image/*', '.pdf'
  onUpload?: (file: File) => Promise<string>;  // Returns uploaded file URL
}

/**
 * Configuration for custom component injection
 * Allows using any custom React component as a field
 */
export interface CustomFieldConfig extends BaseFieldConfig {
  type: 'custom';
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

/**
 * Discriminated union of all possible field configurations
 * This enables type-safe field handling based on the 'type' property
 */
export type FieldConfig =
  | InputFieldConfig
  | TextareaFieldConfig
  | SelectFieldConfig
  | SlugFieldConfig
  | CharCounterFieldConfig
  | AutocompleteFieldConfig
  | FileUploadFieldConfig
  | CustomFieldConfig;

/**
 * Type guard to check if a field is an input field
 */
export function isInputField(field: FieldConfig): field is InputFieldConfig {
  return field.type === 'input';
}

/**
 * Type guard to check if a field is a textarea field
 */
export function isTextareaField(field: FieldConfig): field is TextareaFieldConfig {
  return field.type === 'textarea';
}

/**
 * Type guard to check if a field is a select field
 */
export function isSelectField(field: FieldConfig): field is SelectFieldConfig {
  return field.type === 'select';
}

/**
 * Props for the DynamicForm component
 * Uses generics to maintain type safety for form values
 */
export interface DynamicFormProps<TFormValues extends Record<string, any>> {
  fieldDefs: FieldConfig[];
  values: TFormValues;
  touched: Partial<Record<keyof TFormValues, boolean>>;
  errors: Partial<Record<keyof TFormValues, string>>;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  setFieldValue: <K extends keyof TFormValues>(field: K, value: TFormValues[K]) => void;
}

/**
 * Props for individual form input components
 */
export interface FormInputProps<TFormValues extends Record<string, any>> {
  field: FieldConfig;
  values: TFormValues;
  setFieldValue: <K extends keyof TFormValues>(field: K, value: TFormValues[K]) => void;
  touched: Partial<Record<keyof TFormValues, boolean>>;
  errors: Partial<Record<keyof TFormValues, string>>;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

/**
 * Type for field names, ensuring they exist in the form values
 */
export type FieldName<TFormValues> = Extract<keyof TFormValues, string>;

/**
 * Helper type to ensure field configs match form values
 */
export type TypedFieldConfig<TFormValues extends Record<string, any>> = FieldConfig & {
  name: FieldName<TFormValues>;
};

/**
 * Field section for grouping related fields
 * Can be collapsible (Accordion) or static
 */
export interface FieldSection {
  title: string;
  collapsible?: boolean;  // Render as Accordion if true
  defaultExpanded?: boolean;  // Default accordion state
  fields: FieldConfig[];
}

/**
 * Root form structure
 * Supports either flat field list or sectioned layout
 */
export interface FormStructure {
  sections?: FieldSection[];  // Sectioned layout with groups
  fields?: FieldConfig[];     // Flat layout (no sections)
}
