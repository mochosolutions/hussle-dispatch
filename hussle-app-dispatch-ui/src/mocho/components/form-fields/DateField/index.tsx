import React, { useCallback } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parseISO, format, isValid } from 'date-fns';
import { getIn } from 'formik';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { DateFieldProps } from '../types';

export const DateField: React.FC<DateFieldProps> = ({
  name,
  label,
  disabled = false,
  required = false,
  formik,
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const rawValue = getIn(formik.values, name) as string | null;

  const dateValue = rawValue ? parseISO(rawValue) : null;

  const handleChange = useCallback(
    (newValue: Date | null) => {
      if (newValue && isValid(newValue)) {
        formik.setFieldValue(name, format(newValue, 'yyyy-MM-dd'));
      } else {
        formik.setFieldValue(name, null);
      }
    },
    [formik, name],
  );

  return (
    <BaseFieldWrapper name={name} label={label} required={required} error={error} touched={touched}>
      <DatePicker
        value={dateValue}
        onChange={handleChange}
        disabled={disabled}
        slotProps={{
          textField: {
            id: name,
            name,
            fullWidth: true,
            error: Boolean(touched && error),
            onBlur: formik.handleBlur,
            placeholder: 'MM/DD/YYYY',
          },
        }}
      />
    </BaseFieldWrapper>
  );
};
