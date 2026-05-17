import { Box, ButtonBase } from '@mui/material';

import { Body, Meta } from 'components/Typography';

export interface SchedulePresetOption<T extends string = string> {
  value: T;
  title: string;
  sub?: string;
}

interface SchedulePresetGroupProps<T extends string = string> {
  options: SchedulePresetOption<T>[];
  value: T | null;
  onChange: (next: T) => void;
}

const SchedulePresetGroup = <T extends string = string>({
  options,
  value,
  onChange,
}: SchedulePresetGroupProps<T>) => (
  <Box
    role="radiogroup"
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 1,
      mt: 1.5,
    }}
  >
    {options.map((option) => {
      const isActive = value === option.value;
      return (
        <ButtonBase
          key={option.value}
          role="radio"
          aria-checked={isActive}
          onClick={() => onChange(option.value)}
          sx={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0.25,
            px: 1.5,
            py: 1,
            border: '1.5px solid',
            borderColor: isActive ? 'primary.main' : 'grey.200',
            borderRadius: 0.75,
            bgcolor: 'background.paper',
            background: isActive ? 'linear-gradient(180deg, #eff6ff, #fff 70%)' : undefined,
            boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.10)' : 'none',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
            '&:hover': isActive ? undefined : { borderColor: 'primary.main' },
          }}
        >
          <Body sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
            {option.title}
          </Body>
          {option.sub ? (
            <Meta sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2, mt: 0.125 }}>
              {option.sub}
            </Meta>
          ) : null}
        </ButtonBase>
      );
    })}
  </Box>
);

export default SchedulePresetGroup;
