import React from 'react';
import { LoadingButton } from '@mui/lab';
import AnimateButton from '../../extended/AnimateButton';
import type { SubmitButtonProps } from '../types';

/**
 * SubmitButton - Primary form submit button with loading state.
 *
 * Features:
 * - LoadingButton with spinner indicator
 * - AnimateButton wrapper for visual feedback
 * - Configurable size, width, and type
 * - Consistent primary button styling
 */
export const SubmitButton: React.FC<SubmitButtonProps> = ({
  label,
  loading,
  disabled = false,
  fullWidth = true,
  size = 'large',
  type = 'submit',
  onClick,
}) => {
  return (
    <AnimateButton>
      <LoadingButton
        disableElevation
        disabled={disabled || loading}
        loading={loading}
        fullWidth={fullWidth}
        size={size}
        type={type}
        variant="contained"
        color="primary"
        onClick={onClick}
      >
        {label}
      </LoadingButton>
    </AnimateButton>
  );
};
