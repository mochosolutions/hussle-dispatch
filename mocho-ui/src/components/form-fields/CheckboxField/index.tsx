import React from 'react';
import { FormControlLabel, Checkbox } from '@mui/material';
import type { CheckboxFieldProps } from '../types';

/**
 * CheckboxField - Checkbox input with label.
 *
 * Features:
 * - FormControlLabel wrapper for proper layout
 * - Boolean value handling via setFieldValue
 * - Configurable color (primary/secondary)
 * - Does NOT use BaseFieldWrapper (custom layout)
 */
export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  name,
  label,
  color = 'primary',
  formik,
}) => {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={Boolean(formik.values[name])}
          onChange={(event) => {
            formik.setFieldValue(name, event.target.checked);
          }}
          name={name}
          color={color}
        />
      }
      label={label}
    />
  );
};
