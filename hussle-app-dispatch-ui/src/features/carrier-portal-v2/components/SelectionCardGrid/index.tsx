import type { ReactNode } from 'react';
import { Box, ButtonBase } from '@mui/material';

import { BodyMuted, BodyStrong, Meta } from 'components/Typography';

import {
  selectionCardIconSx,
  selectionCardRadioSx,
  selectionCardStateSx,
} from '../_styles/selectionCardStyles';

export interface SelectionCardOption<TValue extends string = string> {
  id: TValue;
  icon?: ReactNode;
  title: string;
  subline?: string;
  footnote?: string;
}

interface SelectionCardGridProps<TValue extends string = string> {
  options: SelectionCardOption<TValue>[];
  value: TValue | null;
  onChange: (id: TValue) => void;
  columns?: 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  showRadio?: boolean;
  locked?: boolean;
  name?: string;
}

const SIZE_PADDING = {
  sm: { p: 1.5, minHeight: 88 },
  md: { p: 2.25, minHeight: 144 },
  lg: { p: 2.25, minHeight: 168 },
} as const;

const SelectionCardGrid = <TValue extends string = string>({
  options,
  value,
  onChange,
  columns = 3,
  size = 'lg',
  showRadio = true,
  locked = false,
  name,
}: SelectionCardGridProps<TValue>) => {
  const sizing = SIZE_PADDING[size];

  return (
    <Box
      role="radiogroup"
      aria-label={name}
      aria-disabled={locked}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: `repeat(${columns}, 1fr)`,
        },
        gap: { xs: 1, sm: size === 'sm' ? 1 : 1.5 },
        width: '100%',
      }}
    >
      {options.map((option) => {
        const selected = value === option.id;

        return (
          <ButtonBase
            key={option.id}
            role="radio"
            aria-checked={selected}
            disabled={locked}
            onClick={() => !locked && onChange(option.id)}
            sx={{
              position: 'relative',
              borderRadius: 1,
              border: '1.5px solid',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              ...sizing,
              ...selectionCardStateSx({ selected, locked }),
            }}
          >
            {showRadio ? (
              <Box
                aria-hidden
                sx={{
                  ...selectionCardRadioSx({ selected, locked }),
                  mb: option.icon ? 1.25 : 1,
                }}
              >
                {selected ? (
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'common.white' }} />
                ) : null}
              </Box>
            ) : null}

            {option.icon ? (
              <Box sx={{ ...selectionCardIconSx({ selected, locked }), mb: 1.5 }}>
                {option.icon}
              </Box>
            ) : null}

            <BodyStrong
              sx={{
                fontSize: size === 'sm' ? 13 : 15,
                fontWeight: 700,
                mb: option.subline ? 0.5 : 0,
              }}
            >
              {option.title}
            </BodyStrong>

            {option.subline ? (
              <BodyMuted sx={{ fontSize: size === 'sm' ? 12 : 13, lineHeight: 1.45 }}>
                {option.subline}
              </BodyMuted>
            ) : null}

            {option.footnote ? (
              <Meta
                sx={{
                  fontSize: 11,
                  mt: 1.5,
                  color: selected && !locked ? 'primary.main' : 'text.secondary',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {option.footnote}
              </Meta>
            ) : null}
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default SelectionCardGrid;
