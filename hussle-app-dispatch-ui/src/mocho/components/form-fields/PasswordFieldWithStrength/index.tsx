import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, FormControl } from '@mui/material';
import { PasswordField } from '../PasswordField';
import { strengthIndicator, strengthColor } from '../../../utils/password-strength';
import type { PasswordFieldWithStrengthProps } from '../types';
import type { StringColorProps } from '../../../types/password';

/**
 * PasswordFieldWithStrength - Password field with strength indicator.
 *
 * Features:
 * - All PasswordField features (visibility toggle)
 * - Visual strength indicator bar
 * - Strength label (Poor/Weak/Normal/Good/Strong)
 * - Calculates strength on password change
 */
export const PasswordFieldWithStrength: React.FC<PasswordFieldWithStrengthProps> = ({
  showStrengthMeter = true,
  formik,
  name,
  ...rest
}) => {
  const [level, setLevel] = useState<StringColorProps | undefined>();

  useEffect(() => {
    const password = (formik.values[name] as string) || '';
    const temp = strengthIndicator(password);
    setLevel(strengthColor(temp));
  }, [formik.values[name], name]);

  return (
    <>
      <PasswordField name={name} formik={formik} {...rest} />

      {showStrengthMeter && level && (
        <FormControl fullWidth sx={{ mt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Box
                sx={{
                  bgcolor: level.color,
                  width: 85,
                  height: 8,
                  borderRadius: '7px',
                }}
              />
            </Grid>
            <Grid item>
              <Typography variant="subtitle1" fontSize="0.75rem">
                {level.label}
              </Typography>
            </Grid>
          </Grid>
        </FormControl>
      )}
    </>
  );
};
