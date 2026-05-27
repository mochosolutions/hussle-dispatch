import React, { useCallback } from 'react';
import { Select, MenuItem, Box, Chip, SelectChangeEvent } from '@mui/material';
import { getIn } from 'formik';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { MultiSelectChipFieldProps } from '../types';

/**
 * MultiSelectChipField - Multi-select dropdown with chip rendering for selected items.
 *
 * Features:
 * - Multi-select MUI Select component
 * - Selected items rendered as Chips
 * - Uses BaseFieldWrapper for consistent layout
 * - Full Formik integration
 */
export const MultiSelectChipField: React.FC<MultiSelectChipFieldProps> = ({
  name,
  label,
  options,
  required = false,
  formik,
}) => {
  const value = (getIn(formik.values, name) as string[]) || [];
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;

  const handleChange = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      formik.setFieldValue(name, event.target.value);
    },
    [formik, name]
  );

  const getLabel = useCallback(
    (val: string): string => {
      const option = options.find((opt) => opt.value === val);
      return option?.label || val;
    },
    [options]
  );

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
        multiple
        value={value}
        onChange={handleChange}
        onBlur={formik.handleBlur}
        fullWidth
        error={Boolean(touched && error)}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(selected as string[]).map((val) => (
              <Chip key={val} label={getLabel(val)} size="small" />
            ))}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </BaseFieldWrapper>
  );
};
