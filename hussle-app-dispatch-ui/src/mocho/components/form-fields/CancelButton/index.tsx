import React from 'react';
import { Button } from '@mui/material';
import type { CancelButtonProps } from '../types';

/**
 * CancelButton - Grey button for cancel/dismiss actions.
 *
 * Features:
 * - Muted grey styling for visual distinction from primary actions
 * - Configurable size and width
 * - Disabled state support (e.g., while form is submitting)
 */
export const CancelButton: React.FC<CancelButtonProps> = ({
  label = 'Cancel',
  disabled = false,
  fullWidth = false,
  size = 'large',
  onClick,
}) => {
  return (
    <Button
      variant="contained"
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
      sx={{
        backgroundColor: 'grey.300',
        color: 'grey.700',
        '&:hover': {
          backgroundColor: 'grey.400',
        },
      }}
    >
      {label}
    </Button>
  );
};
