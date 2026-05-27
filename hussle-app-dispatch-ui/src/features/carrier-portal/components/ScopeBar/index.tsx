import type { ReactNode } from 'react';
import { Box, ButtonBase } from '@mui/material';

import { Meta } from 'components/Typography';

export interface ScopeBarOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: string;
}

interface ScopeBarProps<T extends string = string> {
  options: ScopeBarOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

const ScopeBar = <T extends string = string>({ options, value, onChange }: ScopeBarProps<T>) => (
  <Box
    role="tablist"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      p: 0.5,
      bgcolor: 'grey.100',
      borderRadius: 0.75,
      mb: 2.5,
      width: '100%',
    }}
  >
    {options.map((option) => {
      const isActive = value === option.value;
      return (
        <ButtonBase
          key={option.value}
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(option.value)}
          sx={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            px: 1.75,
            py: 1.125,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? 'primary.dark' : 'text.secondary',
            bgcolor: isActive ? 'background.paper' : 'transparent',
            borderRadius: 0.5,
            boxShadow: isActive ? '0 1px 3px rgba(15, 23, 42, 0.06)' : 'none',
            transition: 'all 0.15s ease',
            '& svg': { fontSize: 14 },
          }}
        >
          {option.icon}
          {option.label}
          {option.count ? (
            <Meta
              sx={{
                fontSize: 11,
                fontWeight: 600,
                px: 0.875,
                py: 0.125,
                borderRadius: '999px',
                bgcolor: isActive ? 'primary.main' : 'rgba(0, 0, 0, 0.06)',
                color: isActive ? 'common.white' : 'text.secondary',
                lineHeight: 1.2,
              }}
            >
              {option.count}
            </Meta>
          ) : null}
        </ButtonBase>
      );
    })}
  </Box>
);

export default ScopeBar;
