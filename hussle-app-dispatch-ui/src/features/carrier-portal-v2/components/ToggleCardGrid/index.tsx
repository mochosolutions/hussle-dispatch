import { Box, ButtonBase } from '@mui/material';

import { BodyMuted, BodyStrong } from 'components/Typography';

import {
  selectionCardRadioSx,
  selectionCardStateSx,
} from '../_styles/selectionCardStyles';

export interface ToggleCardOption<TValue extends string = string> {
  id: TValue;
  label: string;
  subline?: string;
}

interface ToggleCardGridProps<TValue extends string = string> {
  options: ToggleCardOption<TValue>[];
  value: TValue | null;
  onChange: (id: TValue) => void;
  size?: 'sm' | 'md';
  locked?: boolean;
  name?: string;
}

const ToggleCardGrid = <TValue extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  locked = false,
  name,
}: ToggleCardGridProps<TValue>) => {
  const compact = size === 'sm';

  return (
    <Box
      role="radiogroup"
      aria-label={name}
      aria-disabled={locked}
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1.5,
        maxWidth: compact ? 320 : 'none',
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
              borderRadius: 1,
              border: '1.5px solid',
              p: compact ? 1.5 : 2.25,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textAlign: 'left',
              transition: 'all 0.15s ease',
              minHeight: compact ? 48 : 64,
              ...selectionCardStateSx({ selected, locked }),
            }}
          >
            <Box
              aria-hidden
              sx={{
                ...selectionCardRadioSx({ selected, locked }),
                width: compact ? 16 : 20,
                height: compact ? 16 : 20,
              }}
            >
              {selected ? (
                <Box
                  sx={{
                    width: compact ? 6 : 7,
                    height: compact ? 6 : 7,
                    borderRadius: '50%',
                    bgcolor: 'common.white',
                  }}
                />
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <BodyStrong
                sx={{
                  fontSize: compact ? 14 : 15,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: option.subline ? 0.25 : 0,
                }}
              >
                {option.label}
              </BodyStrong>
              {option.subline ? (
                <BodyMuted sx={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>
                  {option.subline}
                </BodyMuted>
              ) : null}
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default ToggleCardGrid;
