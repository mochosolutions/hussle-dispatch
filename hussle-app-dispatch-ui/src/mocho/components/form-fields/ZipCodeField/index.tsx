import React from 'react';
import { InputAdornment, OutlinedInput } from '@mui/material';
import { EnvironmentOutlined } from '@ant-design/icons';
import { getIn } from 'formik';
import { PatternFormat } from 'react-number-format';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { ZipCodeFieldProps } from '../types';

export const ZipCodeField: React.FC<ZipCodeFieldProps> = ({
  name,
  label,
  placeholder = '12345',
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
        format="#####"
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
        startAdornment={
          <InputAdornment position="start">
            <EnvironmentOutlined style={{ fontSize: 16, color: 'inherit', opacity: 0.45 }} />
          </InputAdornment>
        }
      />
    </BaseFieldWrapper>
  );
};
