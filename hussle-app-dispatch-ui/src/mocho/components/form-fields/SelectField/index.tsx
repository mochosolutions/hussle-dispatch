import React from 'react';
import { Select, MenuItem, SelectChangeEvent } from '@mui/material';
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
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  data,
  required = false,
  formik,
}) => {
  const error = formik.errors[name] as string | undefined;
  const touched = formik.touched[name] as boolean | undefined;

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
        value={formik.values[name] || ''}
        onChange={handleChange}
        onBlur={formik.handleBlur}
        fullWidth
        error={Boolean(touched && error)}
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
