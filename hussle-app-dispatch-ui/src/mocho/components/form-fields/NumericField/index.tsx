import React from 'react';
import { InputAdornment, OutlinedInput, Typography } from '@mui/material';
import { getIn } from 'formik';
import { NumericFormat } from 'react-number-format';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { NumericFieldProps } from '../types';

export const NumericField: React.FC<NumericFieldProps> = ({
  name,
  label,
  placeholder,
  disabled = false,
  required = false,
  decimalScale = 0,
  suffix,
  formik,
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const rawValue = getIn(formik.values, name);
  const value = rawValue === null || rawValue === undefined ? '' : rawValue;

  return (
    <BaseFieldWrapper name={name} label={label} required={required} error={error} touched={touched}>
      <NumericFormat
        id={name}
        name={name}
        value={value as string | number}
        onValueChange={(values) => {
          formik.setFieldValue(name, values.floatValue ?? null);
        }}
        onBlur={formik.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        thousandSeparator
        decimalScale={decimalScale}
        customInput={OutlinedInput}
        fullWidth
        error={Boolean(touched && error)}
        endAdornment={
          suffix ? (
            <InputAdornment position="end">
              <Typography
                variant="caption"
                sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 600 }}
              >
                {suffix}
              </Typography>
            </InputAdornment>
          ) : undefined
        }
      />
    </BaseFieldWrapper>
  );
};
