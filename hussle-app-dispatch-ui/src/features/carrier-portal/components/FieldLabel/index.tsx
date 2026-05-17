import type { ReactNode } from 'react';
import { Box } from '@mui/material';

import { Meta } from 'components/Typography';

interface FieldLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  helperText?: ReactNode;
}

const FieldLabel: React.FC<FieldLabelProps> = ({ htmlFor, required, children, helperText }) => {
  return (
    <Box
      component="label"
      htmlFor={htmlFor}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        mb: 1,
        fontSize: 13,
        fontWeight: 600,
        color: 'text.primary',
      }}
    >
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
        {children}
        {required ? (
          <Box component="span" sx={{ color: 'error.main', ml: 0.375, fontWeight: 500 }}>
            *
          </Box>
        ) : null}
      </Box>
      {helperText ? (
        <Meta sx={{ ml: 'auto', fontSize: 11.5, fontWeight: 500 }}>{helperText}</Meta>
      ) : null}
    </Box>
  );
};

export default FieldLabel;
