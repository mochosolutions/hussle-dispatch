import React, { useState } from 'react';
import { OutlinedInput, InputAdornment, IconButton } from '@mui/material';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { PasswordFieldProps } from '../types';

/**
 * PasswordField - Password input field with visibility toggle.
 *
 * Features:
 * - Password visibility toggle (configurable)
 * - Eye icons for show/hide state
 * - Uses BaseFieldWrapper for consistent layout
 * - Full Formik integration
 */
export const PasswordField: React.FC<PasswordFieldProps> = ({
  name,
  label,
  placeholder = 'Enter password',
  required = false,
  enableToggle = true,
  formik,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const error = formik.errors[name] as string | undefined;
  const touched = formik.touched[name] as boolean | undefined;

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <BaseFieldWrapper
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
    >
      <OutlinedInput
        id={name}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={formik.values[name] || ''}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        placeholder={placeholder}
        fullWidth
        error={Boolean(touched && error)}
        endAdornment={
          enableToggle ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
                size="small"
              >
                {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </IconButton>
            </InputAdornment>
          ) : undefined
        }
      />
    </BaseFieldWrapper>
  );
};
