import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { PasswordField } from '../PasswordField';
import type { PasswordFieldWithChecklistProps, ValidationRule } from '../types';

/**
 * Default validation rules for password checklist.
 */
const defaultValidationRules: ValidationRule[] = [
  {
    test: (str: string) => str.length >= 8,
    label: '8-character minimum length',
  },
  {
    test: (str: string) => /[0-9]/.test(str),
    label: 'Contains at least 1 number',
  },
  {
    test: (str: string) => /[a-z]/.test(str) && /[A-Z]/.test(str),
    label: 'Contains at least 1 upper and lowercase letter',
  },
  {
    test: (str: string) => /[!#@$%^&*)(+=._-]/.test(str),
    label: 'Contains at least 1 special character',
  },
];

/**
 * PasswordFieldWithChecklist - Password field with live validation checklist.
 *
 * Features:
 * - All PasswordField features (visibility toggle)
 * - Live validation checklist with check/X icons
 * - Configurable validation rules
 * - Default rules: min length, number, mixed case, special char
 */
export const PasswordFieldWithChecklist: React.FC<PasswordFieldWithChecklistProps> = ({
  validationRules = defaultValidationRules,
  formik,
  name,
  ...rest
}) => {
  const passwordValue = (formik.values[name] as string) || '';

  return (
    <>
      <PasswordField name={name} formik={formik} {...rest} />

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {validationRules.map((rule, index) => {
          const isValid = rule.test(passwordValue);

          return (
            <Grid item xs={12} key={index}>
              <Box display="flex" flexDirection="row" alignItems="center">
                <Box>
                  {isValid ? (
                    <CheckCircleOutlined style={{ color: 'green' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: 'red' }} />
                  )}
                </Box>
                <Typography variant="subtitle1" fontSize="0.75rem" sx={{ ml: 1 }}>
                  {rule.label}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};
