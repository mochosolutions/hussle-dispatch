import React from 'react';
import {
	Grid,
	Stack,
	Select,
	MenuItem,
	InputLabel,
	OutlinedInput,
	FormHelperText,
	TextField,
	Typography,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import {
	FieldConfig,
	FormInputProps,
	FormStructure,
	FieldSection,
} from './types';
import { getFieldValue, getGridBreakpoints } from './utils';
import { SlugField, CharCounterField } from './fields';

/**
 * Renders the appropriate input component based on field type
 * Uses discriminated union types for type-safe field handling
 */
export function getFormInput<TFormValues extends Record<string, any>>({
	field,
	values,
	setFieldValue,
	touched,
	errors,
	handleChange,
	handleBlur,
}: FormInputProps<TFormValues>): JSX.Element {
	const fieldValue = getFieldValue(values, field.name) ?? '';
	const isTouched = getFieldValue(touched, field.name);
	const errorMessage = getFieldValue(errors, field.name);
	const hasError = Boolean(isTouched && errorMessage);

	// Type-safe switch using discriminated union
	switch (field.type) {
		case 'input': {
			// TypeScript now knows this is InputFieldConfig
			const inputType = field.inputType || 'text';
			return (
				<OutlinedInput
					id={field.name}
					type={inputType}
					value={fieldValue}
					name={field.name}
					onBlur={handleBlur}
					onChange={handleChange}
					placeholder={field.placeholder}
					disabled={field.disabled}
					fullWidth
					error={hasError}
					inputProps={{
						maxLength: field.maxLength,
						minLength: field.minLength,
					}}
				/>
			);
		}

		case 'textarea': {
			// TypeScript now knows this is TextareaFieldConfig
			return (
				<TextField
					id={field.name}
					name={field.name}
					value={fieldValue}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder={field.placeholder}
					disabled={field.disabled}
					multiline
					rows={field.rows || 4}
					fullWidth
					error={hasError}
					inputProps={{
						maxLength: field.maxLength,
						minLength: field.minLength,
					}}
				/>
			);
		}

		case 'select': {
			// TypeScript now knows this is SelectFieldConfig
			return (
				<Select
					id={field.name}
					name={field.name}
					value={fieldValue}
					onChange={(e) =>
						setFieldValue(
							field.name as keyof TFormValues,
							e.target.value as TFormValues[keyof TFormValues]
						)
					}
					disabled={field.disabled}
					multiple={field.multiple}
					fullWidth
					error={hasError}
				>
					{field.options.map((option) => (
						<MenuItem key={option.value} value={option.value}>
							{option.label}
						</MenuItem>
					))}
				</Select>
			);
		}

		case 'slug': {
			// Auto-generating slug field
			return (
				<SlugField
					field={field}
					values={values}
					touched={touched}
					errors={errors}
					handleChange={handleChange}
					handleBlur={handleBlur}
					setFieldValue={setFieldValue}
				/>
			);
		}

		case 'charCounter': {
			// Textarea with character counter
			return (
				<CharCounterField
					field={field}
					values={values}
					touched={touched}
					errors={errors}
					handleChange={handleChange}
					handleBlur={handleBlur}
				/>
			);
		}

		case 'autocomplete':
		case 'fileUpload':
		case 'custom':
			// TODO: Implement these field types when needed
			return (
				<FormHelperText error>
					Field type "{field.type}" not yet implemented
				</FormHelperText>
			);

		default: {
			// Exhaustive check - TypeScript will error if we miss a case
			const _exhaustiveCheck: never = field;
			return _exhaustiveCheck;
		}
	}
}

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
function DynamicForm<TFormValues extends Record<string, any>>({
	structure,
	values,
	touched,
	errors,
	handleChange,
	handleBlur,
	setFieldValue,
}: {
	structure: FormStructure;
	values: TFormValues;
	touched: Partial<Record<keyof TFormValues, boolean>>;
	errors: Partial<Record<keyof TFormValues, string>>;
	handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	setFieldValue: <K extends keyof TFormValues>(field: K, value: TFormValues[K]) => void;
}): JSX.Element {
	/**
	 * Render a single field with its label and error message
	 */
	const renderField = (field: FieldConfig) => {
		const { name, label } = field;
		const fieldName = name as keyof TFormValues;
		const fieldError = getFieldValue(touched, name) && getFieldValue(errors, name);
		const gridProps = getGridBreakpoints(field.grid);

		return (
			<Grid item {...gridProps} key={name}>
				<Stack spacing={1}>
					<InputLabel htmlFor={name} required={field.required}>
						{label}
					</InputLabel>
					{getFormInput<TFormValues>({
						field,
						values,
						setFieldValue,
						touched,
						errors,
						handleChange,
						handleBlur,
					})}
					{fieldError && (
						<FormHelperText error>{String(fieldError)}</FormHelperText>
					)}
					{field.helperText && !fieldError && (
						<FormHelperText>{field.helperText}</FormHelperText>
					)}
				</Stack>
			</Grid>
		);
	};

	/**
	 * Render a section (group of fields)
	 * Can be collapsible (Accordion) or static
	 */
	const renderSection = (section: FieldSection, index: number) => {
		const content = (
			<Grid container spacing={2}>
				{section.fields.map(renderField)}
			</Grid>
		);

		// Render as Accordion if collapsible
		if (section.collapsible) {
			return (
				<Accordion key={index} defaultExpanded={section.defaultExpanded !== false}>
					<AccordionSummary expandIcon={<ExpandMore />}>
						<Typography variant="h6">{section.title}</Typography>
					</AccordionSummary>
					<AccordionDetails>{content}</AccordionDetails>
				</Accordion>
			);
		}

		// Render as static section
		return (
			<Stack spacing={2} key={index}>
				<Typography variant="h6">{section.title}</Typography>
				{content}
			</Stack>
		);
	};

	// Render sectioned layout vs flat layout
	if (structure.sections) {
		return (
			<Stack spacing={3}>
				{structure.sections.map(renderSection)}
			</Stack>
		);
	}

	// Flat layout (no sections)
	return (
		<Grid container spacing={2}>
			{structure.fields?.map(renderField)}
		</Grid>
	);
}

export default DynamicForm;
