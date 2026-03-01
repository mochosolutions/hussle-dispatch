import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import type { ReadOnlyFieldDisplayProps } from './types';

/**
 * Default formatter for displaying values
 */
const defaultFormat = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '—'; // Em dash for empty values
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
};

/**
 * ReadOnlyFieldDisplay - Displays a field label + value in read-only mode
 *
 * Matches the visual layout of form fields for consistency when toggling
 * between view and edit modes.
 */
export const ReadOnlyFieldDisplay: React.FC<ReadOnlyFieldDisplayProps> = ({
  label,
  value,
  format,
}) => {
  const displayValue = format ? format(value) : defaultFormat(value);

  return (
    <Stack spacing={0.5}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          minHeight: '24px', // Match input height for consistency
          wordBreak: 'break-word',
        }}
      >
        {displayValue}
      </Typography>
    </Stack>
  );
};

export default ReadOnlyFieldDisplay;
