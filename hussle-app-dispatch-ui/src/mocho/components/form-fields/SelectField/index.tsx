import React from 'react';
import { Select, MenuItem, SelectChangeEvent, Typography } from '@mui/material';
import { getIn } from 'formik';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { SelectFieldProps } from '../types';

/**
 * SelectField - Dropdown select field with validation and error handling.
 *
 * Features:
 * - MUI Select with MenuItem options
 * - Uses BaseFieldWrapper for consistent layout
 * - Full Formik integration
 * - Configurable options array
 * - Optional placeholder text when no value is selected
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  data,
  required = false,
  placeholder,
  formik,
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const value = getIn(formik.values, name) || '';

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    formik.setFieldValue(name, event.target.value);
  };

  return (
    <BaseFieldWrapper
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
    >
      <Select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={formik.handleBlur}
        fullWidth
        displayEmpty={Boolean(placeholder)}
        error={Boolean(touched && error)}
        renderValue={(selected) => {
          if (!selected && placeholder) {
            return <Typography sx={{ color: 'text.secondary' }}>{placeholder}</Typography>;
          }
          const match = data.find((item) => item.value === selected);
          return match ? match.label : String(selected);
        }}
      >
        {data.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
    </BaseFieldWrapper>
  );
};
