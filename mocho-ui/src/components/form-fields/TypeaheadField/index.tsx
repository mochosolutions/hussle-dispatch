import React, { useMemo } from 'react';
import {
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	Divider,
	Paper,
	TextField as MuiTextField,
} from '@mui/material';
import type { PaperProps } from '@mui/material';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { TypeaheadFieldProps, TypeaheadOption } from '../types';

/**
 * TypeaheadField - Single-select autocomplete with optional free text support.
 *
 * Features:
 * - MUI Autocomplete with Formik integration
 * - Parent-provided options for endpoint-agnostic usage
 * - Optional custom option rendering
 * - Optional dropdown footer action button
 */
export const TypeaheadField: React.FC<TypeaheadFieldProps> = ({
	name,
	label,
	options,
	formik,
	placeholder,
	disabled = false,
	required = false,
	helperText,
	allowFreeText = false,
	loading = false,
	noOptionsText = 'No matches found',
	actionButtonLabel,
	onActionButtonClick,
	onInputValueChange,
	renderOptionContent,
}) => {
	const error = formik.errors[name] as string | undefined;
	const touched = formik.touched[name] as boolean | undefined;
	const hasError = Boolean(touched && error);
	const currentValue = (formik.values[name] as string | undefined) ?? '';

	const selectedOption = useMemo(
		() =>
			options.find(
				(option) =>
					option.value === currentValue || option.label === currentValue,
			) ?? null,
		[currentValue, options],
	);

	const hasActionButton = Boolean(actionButtonLabel && onActionButtonClick);

	const ActionPaper: React.FC<PaperProps> = (paperProps) => {
		const { children, ...rest } = paperProps;

		return (
			<Paper {...rest}>
				{children}
				{hasActionButton && (
					<>
						<Divider />
						<Box sx={{ p: 1 }}>
							<Button
								fullWidth
								onClick={onActionButtonClick}
								onMouseDown={(event) => {
									event.preventDefault();
								}}
								size='small'
								variant='text'
							>
								{actionButtonLabel}
							</Button>
						</Box>
					</>
				)}
			</Paper>
		);
	};

	return (
		<BaseFieldWrapper
			name={name}
			label={label}
			required={required}
			error={error}
			touched={touched}
			helperText={helperText}
		>
			<Autocomplete<TypeaheadOption, false, false, boolean>
				disabled={disabled}
				freeSolo={allowFreeText}
				options={options}
				value={selectedOption}
				inputValue={currentValue}
				loading={loading}
				noOptionsText={noOptionsText}
				getOptionLabel={(option) => {
					if (typeof option === 'string') {
						return option;
					}

					return option.label;
				}}
				isOptionEqualToValue={(option, value) => option.value === value.value}
				onInputChange={(_event, value) => {
					formik.setFieldValue(name, value);
					if (onInputValueChange) {
						onInputValueChange(value);
					}
				}}
				onChange={(_event, value) => {
					if (typeof value === 'string') {
						formik.setFieldValue(name, value);
						if (onInputValueChange) {
							onInputValueChange(value);
						}
						return;
					}

					if (value === null) {
						formik.setFieldValue(name, '');
						if (onInputValueChange) {
							onInputValueChange('');
						}
						return;
					}

					formik.setFieldValue(name, value.value);
					if (onInputValueChange) {
						onInputValueChange(value.value);
					}
				}}
				PaperComponent={ActionPaper}
				renderOption={(props, option) => (
					<Box component='li' {...props} key={option.value}>
						{renderOptionContent ? renderOptionContent(option) : option.label}
					</Box>
				)}
				renderInput={(params) => (
					<MuiTextField
						{...params}
						id={name}
						name={name}
						placeholder={placeholder}
						fullWidth
						error={hasError}
						onBlur={formik.handleBlur}
						InputProps={{
							...params.InputProps,
							endAdornment: (
								<>
									{loading ? (
										<CircularProgress color='inherit' size={18} />
									) : null}
									{params.InputProps.endAdornment}
								</>
							),
						}}
					/>
				)}
			/>
		</BaseFieldWrapper>
	);
};
