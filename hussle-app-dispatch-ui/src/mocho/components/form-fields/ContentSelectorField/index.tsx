import React from 'react';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { CheckOutlined } from '@ant-design/icons';
import { getIn } from 'formik';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { ContentSelectorFieldProps } from '../types';

export const ContentSelectorField: React.FC<ContentSelectorFieldProps> = ({
  name,
  label,
  options,
  required = false,
  disabled = false,
  exclusive = true,
  formik,
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const value = getIn(formik.values, name) as string | string[];

  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: string | string[] | null) => {
    if (newValue !== null) {
      formik.setFieldValue(name, newValue);
    }
  };

  const hasIcon = options.some((opt) => opt.icon);

  return (
    <BaseFieldWrapper name={name} label={label} required={required} error={error} touched={touched}>
      <ToggleButtonGroup
        value={value}
        exclusive={exclusive}
        onChange={handleChange}
        disabled={disabled}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0,
          '& .MuiToggleButtonGroup-grouped': {
            border: '1px solid',
            borderColor: 'divider',
            '&:not(:first-of-type)': {
              borderLeft: '1px solid',
              borderColor: 'divider',
              marginLeft: 0,
            },
          },
          '& .MuiToggleButton-root': {
            flex: hasIcon ? undefined : 1,
            px: hasIcon ? 3 : 2,
            py: hasIcon ? 1.5 : 0.75,
            textTransform: 'uppercase',
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            color: 'text.secondary',
            position: 'relative',
            '&.Mui-selected': {
              backgroundColor: 'primary.lighter',
              color: 'primary.main',
              borderColor: 'primary.light',
              '&:hover': {
                backgroundColor: 'primary.lighter',
              },
            },
            '&.Mui-disabled': {
              cursor: 'not-allowed',
              opacity: 0.5,
            },
          },
        }}
      >
        {options.map((opt) => {
          const isSelected = exclusive
            ? value === opt.value
            : Array.isArray(value) && value.includes(opt.value);

          return (
            <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label}>
              {hasIcon ? (
                <Stack alignItems="center" spacing={0.5} sx={{ position: 'relative' }}>
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -4,
                        left: -8,
                        fontSize: 10,
                        color: 'primary.main',
                      }}
                    >
                      <CheckOutlined />
                    </Box>
                  )}
                  <Box sx={{ fontSize: 20, lineHeight: 1 }}>{opt.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                    {opt.label}
                  </Typography>
                </Stack>
              ) : (
                opt.label
              )}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    </BaseFieldWrapper>
  );
};
