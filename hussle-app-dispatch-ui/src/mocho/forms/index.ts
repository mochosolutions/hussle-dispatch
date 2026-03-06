// Hooks
export { useFormRef, type UseFormRefReturn } from './hooks/useFormRef';
export { useDirtyFormBlocker } from './hooks/useDirtyFormBlocker';

// Form types
export type {
	FormHandle,
	FormState,
	FormStateChangeCallback,
} from './types/form';

// Form field types
export type {
	FormikFieldProps,
	BaseFieldWrapperProps,
	BaseInputFieldProps,
	EmailFieldProps,
	TextFieldProps,
	PasswordFieldProps,
	ValidationRule,
	PasswordFieldWithStrengthProps,
	PasswordFieldWithChecklistProps,
	ConfirmPasswordFieldProps,
	OTPFieldProps,
	CheckboxFieldProps,
	SelectOption,
	SelectFieldProps,
	TypeaheadOption,
	TypeaheadFieldProps,
	CharCounterFieldProps,
	MultiSelectChipFieldProps,
	DateTimePickerFieldProps,
	ImageUploadFieldProps,
	RichTextEditorFieldProps,
	SubmitButtonProps,
	SecondaryButtonProps,
	FormLinkProps,
	TermsNoticeProps,
	FormErrorProps,
	HelperTextProps,
} from './types/formFields';
