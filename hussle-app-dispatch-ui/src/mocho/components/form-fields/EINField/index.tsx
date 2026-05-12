import React from 'react';
import { OutlinedInput } from '@mui/material';
import { getIn } from 'formik';
import { PatternFormat } from 'react-number-format';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { EINFieldProps } from '../types';

export const EINField: React.FC<EINFieldProps> = ({
  name,
  label,
  placeholder = 'XX-XXXXXXX',
  disabled = false,
  required = false,
  formik,
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const value = (getIn(formik.values, name) as string) || '';

  return (
    <BaseFieldWrapper name={name} label={label} required={required} error={error} touched={touched}>
      <PatternFormat
        id={name}
        name={name}
        format="##-#######"
        value={value}
        onValueChange={(values) => {
          formik.setFieldValue(name, values.value);
        }}
        onBlur={formik.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        customInput={OutlinedInput}
        fullWidth
        error={Boolean(touched && error)}
      />
    </BaseFieldWrapper>
  );
};
