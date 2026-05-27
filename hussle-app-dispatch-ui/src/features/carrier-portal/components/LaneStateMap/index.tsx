import type { ReactNode } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { CheckOutlined, CloseOutlined } from '@mui/icons-material';

import { BodyMuted, Meta } from 'components/Typography';

export type LanePreference = 'neutral' | 'preferred' | 'avoid';
export type LanePreferences = Record<string, LanePreference>;

interface LaneStateMapProps {
  value: LanePreferences;
  onChange: (next: LanePreferences) => void;
  disabled?: boolean;
}

const STATE_GRID: (string | null)[][] = [
  [null, null, null, null, null, null, null, null, null, null, 'ME'],
  ['WA', 'ID', 'MT', 'ND', 'MN', 'WI', 'MI', null, 'NY', 'VT', 'NH'],
  ['OR', 'NV', 'WY', 'SD', 'IA', 'IL', 'IN', 'OH', 'PA', 'NJ', 'MA'],
  ['CA', 'UT', 'CO', 'NE', 'MO', 'KY', 'WV', 'VA', 'MD', 'DE', 'RI'],
  [null, 'AZ', 'NM', 'KS', 'AR', 'TN', 'NC', 'SC', 'CT', null, null],
  [null, null, null, 'OK', 'LA', 'MS', 'AL', 'GA', null, null, null],
  [null, null, null, 'TX', null, null, null, 'FL', null, null, null],
];

const REGIONS = {
  northeast: ['ME', 'NY', 'VT', 'NH', 'PA', 'NJ', 'MA', 'RI', 'CT', 'MD', 'DE'],
  southeast: ['VA', 'NC', 'SC', 'TN', 'GA', 'FL', 'AL', 'MS', 'KY', 'WV', 'AR', 'LA'],
  midwest: ['ND', 'MN', 'WI', 'MI', 'SD', 'IA', 'IL', 'IN', 'OH', 'NE', 'MO', 'KS'],
  west: ['WA', 'OR', 'CA', 'ID', 'NV', 'UT', 'AZ', 'MT', 'WY', 'CO', 'NM'],
} as const;

const nextPreference = (current: LanePreference): LanePreference => {
  if (current === 'neutral') return 'preferred';
  if (current === 'preferred') return 'avoid';
  return 'neutral';
};

const buildPreset = (
  preferred: readonly string[],
  avoid: readonly string[] = [],
): LanePreferences => {
  const next: LanePreferences = {};
  preferred.forEach((code) => {
    next[code] = 'preferred';
  });
  avoid.forEach((code) => {
    next[code] = 'avoid';
  });
  return next;
};

const swatchStyles = (variant: 'neutral' | 'preferred' | 'avoid') => {
  if (variant === 'preferred') {
    return { bgcolor: 'secondary.lighter', borderColor: 'secondary.main' };
  }
  if (variant === 'avoid') {
    return { bgcolor: 'rgba(254, 226, 226, 1)', borderColor: 'error.main' };
  }
  return { bgcolor: 'background.paper', borderColor: 'grey.200' };
};

const STATE_GLYPH: Record<LanePreference, ReactNode | null> = {
  neutral: null,
  preferred: <CheckOutlined sx={{ fontSize: 9 }} />,
  avoid: <CloseOutlined sx={{ fontSize: 9 }} />,
};

const GLYPH_BG: Record<LanePreference, string | null> = {
  neutral: null,
  preferred: 'success.main',
  avoid: 'error.main',
};

const StateGlyph: React.FC<{ state: LanePreference }> = ({ state }) => {
  const bg = GLYPH_BG[state];
  const glyph = STATE_GLYPH[state];
  if (!glyph || !bg) return null;
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: 1.5,
        right: 1.5,
        width: 12,
        height: 12,
        borderRadius: '50%',
        bgcolor: bg,
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 0 1.5px #fff',
      }}
    >
      {glyph}
    </Box>
  );
};

const LegendKey: React.FC<{
  variant: 'neutral' | 'preferred' | 'avoid';
  label: string;
}> = ({ variant, label }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.625, fontWeight: 500 }}>
    <Box
      sx={{
        position: 'relative',
        width: 16,
        height: 16,
        borderRadius: 0.5,
        border: '1.5px solid',
        flexShrink: 0,
        ...swatchStyles(variant),
      }}
    >
      <StateGlyph state={variant} />
    </Box>
    {label}
  </Box>
);

const cellStateSx = (state: LanePreference) => {
  if (state === 'preferred') {
    return {
      bgcolor: 'secondary.lighter',
      borderColor: 'secondary.main',
      color: 'rgba(6, 78, 59, 1)',
    };
  }
  if (state === 'avoid') {
    return {
      bgcolor: 'rgba(254, 226, 226, 1)',
      borderColor: 'error.main',
      color: 'rgba(127, 29, 29, 1)',
      textDecoration: 'line-through',
      textDecorationThickness: '1.5px',
    };
  }
  return {
    bgcolor: 'background.paper',
    borderColor: 'grey.200',
    color: 'text.primary',
  };
};

const summarize = (value: LanePreferences): { preferred: number; avoided: number } => {
  let preferred = 0;
  let avoided = 0;
  Object.values(value).forEach((pref) => {
    if (pref === 'preferred') preferred += 1;
    if (pref === 'avoid') avoided += 1;
  });
  return { preferred, avoided };
};

const LaneStateMap: React.FC<LaneStateMapProps> = ({ value, onChange, disabled = false }) => {
  const handleCellClick = (code: string) => {
    if (disabled) return;
    const current = value[code] ?? 'neutral';
    const next = nextPreference(current);
    if (next === 'neutral') {
      const filtered = Object.fromEntries(
        Object.entries(value).filter(([k]) => k !== code),
      ) as LanePreferences;
      onChange(filtered);
      return;
    }
    onChange({ ...value, [code]: next });
  };

  const applyPreset = (preset: LanePreferences) => {
    if (disabled) return;
    onChange(preset);
  };

  const { preferred, avoided } = summarize(value);

  return (
    <Box>
      {/* Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
        <Meta sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13 }}>Lanes</Meta>
        <Meta sx={{ fontSize: 12 }}>
          {preferred} preferred · {avoided} avoided
        </Meta>
      </Box>

      {/* Legend + instruction */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          py: 1.25,
          px: 1.75,
          bgcolor: 'grey.100',
          border: '1px solid',
          borderColor: 'grey.200',
          borderRadius: 0.75,
          mb: 1.5,
          fontSize: 12.5,
          color: 'text.secondary',
        }}
      >
        <LegendKey variant="neutral" label="Neutral" />
        <LegendKey variant="preferred" label="Preferred" />
        <LegendKey variant="avoid" label="Avoid" />
        <BodyMuted
          sx={{
            ml: 'auto',
            fontSize: 11.5,
            fontStyle: 'italic',
          }}
        >
          Tap a state to cycle neutral → preferred → avoid.
        </BodyMuted>
      </Box>

      {/* Region shortcuts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
        <RegionButton onClick={() => applyPreset({})} disabled={disabled}>
          All neutral
        </RegionButton>
        <RegionButton
          onClick={() => applyPreset(buildPreset(REGIONS.northeast))}
          disabled={disabled}
        >
          Prefer Northeast
        </RegionButton>
        <RegionButton
          onClick={() => applyPreset(buildPreset(REGIONS.southeast))}
          disabled={disabled}
        >
          Prefer Southeast
        </RegionButton>
        <RegionButton
          onClick={() => applyPreset(buildPreset(REGIONS.midwest))}
          disabled={disabled}
        >
          Prefer Midwest
        </RegionButton>
        <RegionButton onClick={() => applyPreset(buildPreset(REGIONS.west))} disabled={disabled}>
          Prefer West
        </RegionButton>
        <RegionButton
          onClick={() => applyPreset(buildPreset(REGIONS.northeast, ['MT', 'WY']))}
          disabled={disabled}
          accent
        >
          Northeast + avoid MT/WY
        </RegionButton>
      </Box>

      {/* State grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(6, 1fr)',
            sm: 'repeat(8, 1fr)',
            md: 'repeat(11, 1fr)',
          },
          gap: 0.5,
          p: 1.5,
          bgcolor: 'grey.100',
          border: '1px solid',
          borderColor: 'grey.200',
          borderRadius: 0.75,
        }}
      >
        {STATE_GRID.flatMap((row, rowIdx) =>
          row.map((code, colIdx) => {
            const key = `${rowIdx}-${colIdx}`;
            if (code === null) {
              return (
                <Box
                  key={key}
                  aria-hidden
                  sx={{
                    aspectRatio: '1.1',
                    visibility: 'hidden',
                    display: { xs: 'none', md: 'block' },
                  }}
                />
              );
            }
            const pref = value[code] ?? 'neutral';
            return (
              <ButtonBase
                key={key}
                onClick={() => handleCellClick(code)}
                disabled={disabled}
                aria-label={`${code} — ${pref}`}
                sx={{
                  position: 'relative',
                  aspectRatio: '1.1',
                  border: '1.5px solid',
                  borderRadius: 0.5,
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  transition: 'all 0.12s',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  '&:hover:not(:disabled)': {
                    borderColor: 'grey.400',
                    transform: 'scale(1.05)',
                    zIndex: 2,
                  },
                  '&:focus-visible': {
                    outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 1,
                  },
                  ...cellStateSx(pref),
                }}
              >
                {code}
                <StateGlyph state={pref} />
              </ButtonBase>
            );
          }),
        )}
      </Box>
    </Box>
  );
};

const RegionButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, accent, children }) => (
  <ButtonBase
    onClick={onClick}
    disabled={disabled}
    sx={{
      border: '1px solid',
      borderColor: accent ? 'primary.main' : 'grey.200',
      bgcolor: accent ? 'primary.main' : 'background.paper',
      color: accent ? 'common.white' : 'text.secondary',
      borderRadius: 999,
      px: 1.25,
      py: 0.5,
      fontSize: 12,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s',
      '&:hover:not(:disabled)': {
        borderColor: 'primary.main',
        color: accent ? 'common.white' : 'primary.main',
      },
    }}
  >
    {children}
  </ButtonBase>
);

export default LaneStateMap;
