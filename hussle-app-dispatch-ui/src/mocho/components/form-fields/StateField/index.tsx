import React from 'react';
import { Select, MenuItem, SelectChangeEvent, Typography } from '@mui/material';
import { getIn } from 'formik';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import US_STATES from 'utils/constants/usStates';
import type { StateFieldProps } from '../types';

export const StateField: React.FC<StateFieldProps> = ({
  name,
  label,
  required = false,
  placeholder = 'Select state',
  disabled = false,
  formik,
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const value = (getIn(formik.values, name) as string) || '';

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    formik.setFieldValue(name, event.target.value);
  };

  return (
    <BaseFieldWrapper name={name} label={label} required={required} error={error} touched={touched}>
      <Select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={formik.handleBlur}
        fullWidth
        disabled={disabled}
        displayEmpty
        error={Boolean(touched && error)}
        renderValue={(selected) => {
          if (!selected) {
            return <Typography sx={{ color: 'text.secondary' }}>{placeholder}</Typography>;
          }
          const match = US_STATES.find((s) => s.value === selected);
          return match ? match.label : String(selected);
        }}
      >
        {US_STATES.map((state) => (
          <MenuItem key={state.value} value={state.value}>
            {state.label}
          </MenuItem>
        ))}
      </Select>
    </BaseFieldWrapper>
  );
};
