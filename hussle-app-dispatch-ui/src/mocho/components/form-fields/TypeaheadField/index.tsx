import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AutocompleteInputChangeReason, PaperProps } from '@mui/material';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  TextField as MuiTextField,
} from '@mui/material';
import { getIn } from 'formik';
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
  onOptionSelect,
  renderOptionContent,
  startAdornment,
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const hasError = Boolean(touched && error);
  const currentValue = (getIn(formik.values, name) as string | undefined) ?? '';

  const selectedOption = useMemo(
    () => options.find((option) => option.value === currentValue) ?? null,
    [currentValue, options],
  );

  const [inputValue, setInputValue] = useState(() => {
    if (allowFreeText) {
      return currentValue;
    }

    return selectedOption?.label ?? '';
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (allowFreeText) {
      setInputValue(currentValue);
      return;
    }

    if (currentValue.length === 0) {
      setInputValue('');
      return;
    }

    if (selectedOption !== null) {
      setInputValue(selectedOption.label);
    }
  }, [allowFreeText, currentValue, selectedOption]);

  const hasActionButton = Boolean(actionButtonLabel && onActionButtonClick);

  const ActionPaper = useMemo(
    () =>
      function TypeaheadActionPaper(paperProps: PaperProps) {
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
                    size="small"
                    variant="text"
                  >
                    {actionButtonLabel}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        );
      },
    [hasActionButton, onActionButtonClick, actionButtonLabel],
  );

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
        inputValue={inputValue}
        loading={loading}
        noOptionsText={noOptionsText}
        getOptionLabel={(option) => {
          if (typeof option === 'string') {
            return option;
          }

          return option.label;
        }}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        onInputChange={(_event, value, reason: AutocompleteInputChangeReason) => {
          setInputValue(value);

          if (allowFreeText) {
            formik.setFieldValue(name, value);
          }

          if (reason === 'input' && onInputValueChange) {
            onInputValueChange(value);
          }
        }}
        onChange={(_event, value) => {
          if (typeof value === 'string') {
            formik.setFieldValue(name, value);
            setInputValue(value);
            onOptionSelect?.(null);
            return;
          }

          if (value === null) {
            formik.setFieldValue(name, '');
            setInputValue('');
            onOptionSelect?.(null);
            setTimeout(() => inputRef.current?.blur(), 0);
            return;
          }

          formik.setFieldValue(name, value.value);
          setInputValue(value.label);
          onOptionSelect?.(value);
          setTimeout(() => inputRef.current?.blur(), 0);
        }}
        PaperComponent={ActionPaper}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.value}>
            {renderOptionContent ? renderOptionContent(option) : option.label}
          </Box>
        )}
        renderInput={(params) => (
          <MuiTextField
            {...params}
            name={name}
            placeholder={placeholder}
            fullWidth
            error={hasError}
            onBlur={formik.handleBlur}
            inputRef={inputRef}
            inputProps={{
              ...params.inputProps,
              id: name,
            }}
            InputProps={{
              ...params.InputProps,
              ...(startAdornment ? { startAdornment } : {}),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
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
