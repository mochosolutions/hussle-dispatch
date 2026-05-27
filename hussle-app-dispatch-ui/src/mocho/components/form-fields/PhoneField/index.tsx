import React from 'react';
import { InputAdornment, OutlinedInput } from '@mui/material';
import { PhoneOutlined } from '@ant-design/icons';
import { getIn } from 'formik';
import { PatternFormat } from 'react-number-format';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { PhoneFieldProps } from '../types';

export const PhoneField: React.FC<PhoneFieldProps> = ({
  name,
  label,
  placeholder = '(555) 123-4567',
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
        format="(###) ###-####"
        mask="_"
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
            <PhoneOutlined style={{ fontSize: 16, color: 'inherit', opacity: 0.45 }} />
          </InputAdornment>
        }
      />
    </BaseFieldWrapper>
  );
};
