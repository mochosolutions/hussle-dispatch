import React, { useMemo } from 'react';
import { Box, Grid, Typography, FormControl } from '@mui/material';
import { PasswordField } from '../PasswordField';
import { strengthIndicator, strengthColor } from '../../../utils/password-strength';
import type { PasswordFieldWithStrengthProps } from '../types';

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
  const password = (formik.values[name] as string) ?? '';
  const level = useMemo(
    () => strengthColor(strengthIndicator(password)),
    [password],
  );

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
