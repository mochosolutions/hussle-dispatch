import React, { useCallback } from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { parse, format, isValid } from 'date-fns';
import { getIn } from 'formik';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { TimeFieldProps } from '../types';

export const TimeField: React.FC<TimeFieldProps> = ({
  name,
  label,
  disabled = false,
  required = false,
  formik,
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const rawValue = getIn(formik.values, name) as string | null;

  const timeValue = rawValue ? parse(rawValue, 'HH:mm', new Date()) : null;

  const handleChange = useCallback(
    (newValue: Date | null) => {
      if (newValue && isValid(newValue)) {
        formik.setFieldValue(name, format(newValue, 'HH:mm'));
      } else {
        formik.setFieldValue(name, null);
      }
    },
    [formik, name],
  );

  return (
    <BaseFieldWrapper name={name} label={label} required={required} error={error} touched={touched}>
      <TimePicker
        value={timeValue}
        onChange={handleChange}
        disabled={disabled}
        minutesStep={30}
        skipDisabled
        slotProps={{
          textField: {
            id: name,
            name,
            fullWidth: true,
            error: Boolean(touched && error),
            onBlur: formik.handleBlur,
            placeholder: 'hh:mm AM/PM',
          },
        }}
      />
    </BaseFieldWrapper>
  );
};
