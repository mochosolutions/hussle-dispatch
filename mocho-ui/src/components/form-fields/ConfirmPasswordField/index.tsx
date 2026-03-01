import React from 'react';
import { PasswordField } from '../PasswordField';
import type { ConfirmPasswordFieldProps } from '../types';

/**
 * ConfirmPasswordField - Password confirmation field.
 *
 * Features:
 * - Wrapper around PasswordField with default label/placeholder
 * - Optional visibility toggle
 * - Uses BaseFieldWrapper (via PasswordField)
 */
export const ConfirmPasswordField: React.FC<ConfirmPasswordFieldProps> = ({
  name,
  label = 'Confirm Password',
  placeholder = 'Enter confirm password',
  enableToggle = true,
  ...rest
}) => {
  return (
    <PasswordField
      name={name}
      label={label}
      placeholder={placeholder}
      enableToggle={enableToggle}
      {...rest}
    />
  );
};
