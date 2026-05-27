import React from 'react';
import { InputAdornment, OutlinedInput } from '@mui/material';
import { PercentageOutlined } from '@ant-design/icons';
import { getIn } from 'formik';
import { NumericFormat } from 'react-number-format';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { PercentFieldProps } from '../types';

export const PercentField: React.FC<PercentFieldProps> = ({
  name,
  label,
  placeholder = '0',
  disabled = false,
  required = false,
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
        decimalScale={1}
        isAllowed={(values) => {
          const { floatValue } = values;
          return floatValue === undefined || (floatValue >= 0 && floatValue <= 100);
        }}
        customInput={OutlinedInput}
        fullWidth
        error={Boolean(touched && error)}
        endAdornment={
          <InputAdornment position="end">
            <PercentageOutlined style={{ fontSize: 16, color: 'inherit', opacity: 0.45 }} />
          </InputAdornment>
        }
      />
    </BaseFieldWrapper>
  );
};
