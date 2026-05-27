import { Box, ButtonBase } from '@mui/material';

import { BodyMuted, BodyStrong, Meta } from 'components/Typography';

export interface OptCardOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

interface OptCardProps<T extends string | number = string | number> {
  label: string;
  amount: string | number;
  unit?: string;
  options: OptCardOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

const OptCard = <T extends string | number = string | number>({
  label,
  amount,
  unit,
  options,
  value,
  onChange,
}: OptCardProps<T>) => (
  <Box
    sx={{
      border: '1px solid',
      borderColor: 'grey.200',
      borderRadius: 0.75,
      px: 1.75,
      py: 1.5,
      bgcolor: 'background.paper',
    }}
  >
    <Meta
      sx={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        mb: 1,
      }}
    >
      {label}
    </Meta>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
      <BodyStrong
        sx={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {amount}
      </BodyStrong>
      {unit ? <BodyMuted sx={{ fontSize: 13, fontWeight: 500 }}>{unit}</BodyMuted> : null}
    </Box>
    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <ButtonBase
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            sx={{
              flex: 1,
              px: 0.75,
              py: 0.5,
              border: '1px solid',
              borderColor: isActive ? 'primary.main' : 'grey.200',
              borderRadius: 0.5,
              bgcolor: isActive ? 'primary.main' : 'background.paper',
              color: isActive ? 'common.white' : 'text.secondary',
              fontFamily: 'inherit',
              fontSize: 11.5,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              transition: 'all 0.12s ease',
              '&:hover': isActive ? undefined : { borderColor: 'grey.300', bgcolor: 'grey.50' },
            }}
          >
            {option.label}
          </ButtonBase>
        );
      })}
    </Box>
  </Box>
);

export default OptCard;
