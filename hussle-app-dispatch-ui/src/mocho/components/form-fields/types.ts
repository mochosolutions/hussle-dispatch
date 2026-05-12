import { FormikErrors, FormikTouched } from 'formik';

/**
 * Common Formik props passed to form field components.
 * This interface provides a subset of Formik functionality needed for form fields.
 */
export interface FormikFieldProps<T = Record<string, unknown>> {
	values: T;
	errors: FormikErrors<T>;
	touched: FormikTouched<T>;
	handleChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
	handleBlur: (
		e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
	setFieldValue: (field: string, value: unknown) => void;
}

/**
 * Base props shared by all field wrapper components.
 */
export interface BaseFieldWrapperProps {
	name: string;
	label: string;
	required?: boolean;
	error?: string;
	touched?: boolean;
	helperText?: string;
	children: React.ReactNode;
}

/**
 * Common props shared by most input field components.
 */
interface BaseInputFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	autoComplete?: string;
	formik: FormikFieldProps;
}

/**
 * Props for EmailField component.
 */
export type EmailFieldProps = BaseInputFieldProps;

/**
 * Props for TextField component.
 */
export interface TextFieldProps extends BaseInputFieldProps {
	type?: 'text' | 'number' | 'tel';
	multiline?: boolean;
	minRows?: number;
}

/**
 * Props for DateField component.
 */
export type DateFieldProps = Omit<BaseInputFieldProps, 'placeholder'>;

/**
 * Props for TimeField component.
 */
export type TimeFieldProps = Omit<BaseInputFieldProps, 'placeholder'>;

/**
 * Props for PasswordField component.
 */
export interface PasswordFieldProps extends Omit<
	BaseInputFieldProps,
	'disabled'
> {
	enableToggle?: boolean;
}

/**
 * Validation rule for password checklist.
 */
export interface ValidationRule {
	test: (value: string) => boolean;
	label: string;
}

/**
 * Props for PasswordFieldWithStrength component.
 */
export interface PasswordFieldWithStrengthProps extends PasswordFieldProps {
	showStrengthMeter?: boolean;
}

/**
 * Props for PasswordFieldWithChecklist component.
 */
export interface PasswordFieldWithChecklistProps extends PasswordFieldProps {
	validationRules?: ValidationRule[];
}

/**
 * Props for ConfirmPasswordField component.
 */
export type ConfirmPasswordFieldProps = PasswordFieldProps;

/**
 * Props for OTPField component.
 */
export interface OTPFieldProps {
	name: string;
	label?: string;
	numDigits?: number;
	formik: FormikFieldProps;
}

/**
 * Props for CheckboxField component.
 */
export interface CheckboxFieldProps {
	name: string;
	label: string;
	color?: 'primary' | 'secondary';
	formik: FormikFieldProps;
}

/**
 * Select option type.
 */
export interface SelectOption {
	value: string;
	label: string;
}

/**
 * Typeahead option type.
 */
export interface TypeaheadOption {
	value: string;
	label: string;
	description?: string;
	metadata?: Record<string, string>;
}

/**
 * Props for SelectField component.
 */
export interface SelectFieldProps {
	name: string;
	label: string;
	data: SelectOption[];
	required?: boolean;
	placeholder?: string;
	formik: FormikFieldProps;
}

/**
 * Props for TypeaheadField component.
 * Single-select autocomplete field with optional free text input.
 */
export interface TypeaheadFieldProps {
	name: string;
	label: string;
	options: TypeaheadOption[];
	formik: FormikFieldProps;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	helperText?: string;
	allowFreeText?: boolean;
	loading?: boolean;
	noOptionsText?: string;
	actionButtonLabel?: string;
	onActionButtonClick?: () => void;
	onInputValueChange?: (value: string) => void;
	onOptionSelect?: (option: TypeaheadOption | null) => void;
	renderOptionContent?: (option: TypeaheadOption) => React.ReactNode;
	startAdornment?: React.ReactNode;
}

/**
 * Props for CharCounterField component.
 * Multiline textarea with character counter display.
 */
export interface CharCounterFieldProps {
	name: string;
	label: string;
	maxLength: number;
	rows?: number;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	formik: FormikFieldProps;
}

/**
 * Props for MultiSelectChipField component.
 * Multi-select dropdown with chip rendering for selected items.
 */
export interface MultiSelectChipFieldProps {
	name: string;
	label: string;
	options: SelectOption[];
	required?: boolean;
	formik: FormikFieldProps;
}

/**
 * Props for DateTimePickerField component.
 * MUI DateTimePicker wrapped as a form-field.
 */
export interface DateTimePickerFieldProps {
	name: string;
	label: string;
	required?: boolean;
	helperText?: string;
	minDate?: Date;
	maxDate?: Date;
	formik: FormikFieldProps;
}

/**
 * Props for ImageUploadField component.
 * File upload with image preview, validation, and remove functionality.
 */
export interface ImageUploadFieldProps {
	/** Field name for the File object */
	name: string;
	/** Field name for existing URL (edit mode) */
	urlFieldName?: string;
	label: string;
	/** Accept attribute for file input (default: 'image/*') */
	accept?: string;
	/** Maximum file size in MB (default: 10) */
	maxSizeMB?: number;
	/** Height of preview area in pixels (default: 200) */
	previewHeight?: number;
	helperText?: string;
	formik: FormikFieldProps;
}

/**
 * Props for RichTextEditorField component.
 * TiptapEditor wrapped as a form-field with Formik integration.
 */
export interface RichTextEditorFieldProps {
	name: string;
	label: string;
	required?: boolean;
	placeholder?: string;
	/** Minimum height of editor in pixels (default: 400) */
	minHeight?: number;
	/** Maximum height of editor in pixels (default: 600) */
	maxHeight?: number;
	/** Callback when image is selected (deferred upload pattern) */
	onImageSelect?: (file: File) => { blobUrl: string; placeholderId: string };
	formik: FormikFieldProps;
}

/**
 * Props for SubmitButton component.
 */
export interface SubmitButtonProps {
	label: string;
	loading: boolean;
	disabled?: boolean;
	fullWidth?: boolean;
	size?: 'small' | 'medium' | 'large';
	type?: 'submit' | 'button';
	form?: string;
	onClick?: () => void;
}

/**
 * Props for CancelButton component.
 */
export interface CancelButtonProps {
	label?: string;
	disabled?: boolean;
	fullWidth?: boolean;
	size?: 'small' | 'medium' | 'large';
	onClick: () => void;
}

/**
 * Props for SecondaryButton component.
 */
export interface SecondaryButtonProps {
	label: string;
	onClick: () => void;
	variant?: 'text' | 'outlined';
}

/**
 * Props for FormLink component.
 */
export interface FormLinkProps {
	label: string;
	to: string;
	variant?: 'h6' | 'subtitle2' | 'body2';
	underline?: boolean;
	color?: string;
}

/**
 * Props for TermsNotice component.
 */
export interface TermsNoticeProps {
	termsLink: string;
	privacyLink: string;
	customText?: string;
}

/**
 * Props for FormError component.
 */
export interface FormErrorProps {
	error?: string;
}

/**
 * Props for HelperText component.
 */
export interface HelperTextProps {
	text: string;
	variant?: 'caption' | 'body2';
	color?: string;
}

/**
 * Props for PhoneField component.
 * Masked phone input: (###) ###-####
 */
export interface PhoneFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	formik: FormikFieldProps;
}

/**
 * Props for CurrencyField component.
 * Currency input with $ prefix, thousand separators, 2 decimal places.
 */
export interface CurrencyFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	formik: FormikFieldProps;
}

/**
 * Props for NumericField component.
 * Numeric input with thousand separators, configurable decimals and suffix.
 */
export interface NumericFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	decimalScale?: number;
	suffix?: string;
	formik: FormikFieldProps;
}

/**
 * Props for PercentField component.
 * Percent input with % suffix, 0–100 range.
 */
export interface PercentFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	formik: FormikFieldProps;
}

/**
 * Props for StateField component.
 * US state dropdown selector.
 */
export interface StateFieldProps {
	name: string;
	label: string;
	required?: boolean;
	placeholder?: string;
	disabled?: boolean;
	formik: FormikFieldProps;
}

/**
 * Props for ZipCodeField component.
 * Masked ZIP code input: ##### or #####-####
 */
export interface ZipCodeFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	formik: FormikFieldProps;
}

/**
 * Props for EINField component.
 * Masked EIN input: ##-#######  (stores 9 digits only in Formik).
 */
export interface EINFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	formik: FormikFieldProps;
}

/**
 * Option for ContentSelectorField.
 */
export interface ContentSelectorOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
}

/**
 * Props for ContentSelectorField component.
 * Segmented toggle button group with optional icons.
 */
export interface ContentSelectorFieldProps {
	name: string;
	label: string;
	options: ContentSelectorOption[];
	required?: boolean;
	disabled?: boolean;
	exclusive?: boolean;
	formik: FormikFieldProps;
}
