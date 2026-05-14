import { useCallback } from 'react';

import { Box, Stack } from '@mui/material';

import { Meta } from 'components/Typography';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

type StatePreference = 'PREFERRED' | 'AVOIDED';

const CYCLE_ORDER: (StatePreference | undefined)[] = [undefined, 'PREFERRED', 'AVOIDED'];

interface LegendItemConfig {
  label: string;
  bgcolor: string;
  borderColor: string;
}

const LEGEND_ITEMS: LegendItemConfig[] = [
  { label: 'Neutral', bgcolor: 'grey.300', borderColor: 'grey.300' },
  { label: 'Preferred', bgcolor: 'success.light', borderColor: 'success.main' },
  { label: 'Avoided', bgcolor: 'error.light', borderColor: 'error.main' },
];

interface StateGridProps {
  value: Record<string, string>;
  onChange: (statePrefs: Record<string, string>) => void;
}

const getNextPreference = (current: string | undefined): StatePreference | undefined => {
  const currentIndex = CYCLE_ORDER.indexOf(current as StatePreference | undefined);
  const nextIndex = (currentIndex + 1) % CYCLE_ORDER.length;
  return CYCLE_ORDER[nextIndex];
};

const labelForPreference = (preference: StatePreference | undefined): string => {
  if (preference === 'PREFERRED') {
    return 'Preferred';
  }
  if (preference === 'AVOIDED') {
    return 'Avoided';
  }
  return 'Neutral';
};

const getTileStyles = (preference: string | undefined) => {
  if (preference === 'PREFERRED') {
    return { bgcolor: 'success.light', borderColor: 'success.main' };
  }
  if (preference === 'AVOIDED') {
    return { bgcolor: 'error.light', borderColor: 'error.main' };
  }
  return { bgcolor: 'grey.300', borderColor: 'grey.300' };
};

const LegendItem: React.FC<LegendItemConfig> = ({ label, bgcolor, borderColor }) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <Box
      sx={{
        width: 16,
        height: 16,
        bgcolor,
        border: 2,
        borderColor,
        borderRadius: 0.5,
      }}
    />
    <Meta>{label}</Meta>
  </Stack>
);

export const StateGrid: React.FC<StateGridProps> = ({ value, onChange }) => {
  const handleClick = useCallback(
    (stateCode: string) => {
      const currentPref = value[stateCode];
      const nextPref = getNextPreference(currentPref);

      if (nextPref === undefined) {
        onChange(
          Object.fromEntries(Object.entries(value).filter(([key]) => key !== stateCode)),
        );
      } else {
        onChange({ ...value, [stateCode]: nextPref });
      }
    },
    [value, onChange],
  );

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {LEGEND_ITEMS.map((item) => (
          <LegendItem
            key={item.label}
            label={item.label}
            bgcolor={item.bgcolor}
            borderColor={item.borderColor}
          />
        ))}
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {US_STATES.map((stateCode) => {
          const preference = value[stateCode] as StatePreference | undefined;
          const styles = getTileStyles(preference);
          const prefLabel = labelForPreference(preference);

          return (
            <Box
              key={stateCode}
              role="button"
              tabIndex={0}
              aria-pressed={preference !== undefined}
              aria-label={`${stateCode}: ${prefLabel}, tap to cycle`}
              onClick={() => handleClick(stateCode)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick(stateCode);
                }
              }}
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: styles.bgcolor,
                border: 2,
                borderColor: styles.borderColor,
                borderRadius: '4px',
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              <Meta sx={{ fontWeight: 700, color: 'text.primary' }}>{stateCode}</Meta>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
