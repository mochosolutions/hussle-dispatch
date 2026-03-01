import * as Yup from 'yup';

/**
 * EditableSection - Types
 *
 * Enterprise-ready inline editing pattern with:
 * - One form per section (atomic saves)
 * - Mix of editable and read-only fields
 * - Permission control via canEdit prop
 * - Generic TypeScript support for any entity
 */

export type EditableSectionMode = 'view' | 'edit';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'select'
  | 'date'
  | 'datetime';

export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Field configuration for EditableSection
 */
export interface EditableSectionField {
  /** Field name - must match data object key */
  name: string;

  /** Display label */
  label: string;

  /** Field type for rendering */
  type: FieldType;

  /** Whether field can be edited (default: true) */
  editable?: boolean;

  /** Grid column span (1-12, default: 6) */
  gridSize?: number;

  /** Select options (required for type: 'select') */
  options?: SelectOption[];

  /** Custom formatter for read-only display */
  format?: (value: unknown) => string;

  /** Placeholder text for edit mode */
  placeholder?: string;

  /** Whether field is required */
  required?: boolean;

  /** Number of rows for textarea (default: 3) */
  rows?: number;
}

/**
 * Props for EditableSection component
 */
export interface EditableSectionProps<T extends object> {
  /** Section title displayed in card header */
  title: string;

  /** Field configurations */
  fields: EditableSectionField[];

  /** Current data object */
  data: T;

  /** Callback when section is saved - receives only editable field values */
  onSave: (data: Partial<T>) => Promise<void>;

  /** Yup validation schema for editable fields */
  validationSchema?: Yup.Schema;

  /** Whether user can edit this section (default: true) */
  canEdit?: boolean;

  /** Loading state for data fetch */
  loading?: boolean;

  /** Custom className for MainCard */
  className?: string;
}

/**
 * Ref handle for imperative control of EditableSection
 */
export interface EditableSectionHandle {
  /** Switch to edit mode */
  enterEditMode: () => void;

  /** Switch to view mode (discards changes) */
  exitEditMode: () => void;

  /** Trigger form submission */
  save: () => Promise<void>;

  /** Current mode */
  mode: EditableSectionMode;

  /** Whether form has unsaved changes */
  isDirty: boolean;
}

/**
 * Props for ReadOnlyFieldDisplay component
 */
export interface ReadOnlyFieldDisplayProps {
  /** Field label */
  label: string;

  /** Field value (will be formatted) */
  value: unknown;

  /** Custom formatter function */
  format?: (value: unknown) => string;

  /** Grid column span (1-12) */
  gridSize?: number;
}
