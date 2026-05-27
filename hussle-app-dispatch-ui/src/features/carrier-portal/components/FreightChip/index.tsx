import type { ReactNode } from 'react';
import { ButtonBase } from '@mui/material';
import { BlockOutlined, CheckOutlined } from '@mui/icons-material';

export type FreightChipState = 'neutral' | 'on' | 'avoid';

interface FreightChipProps {
  state: FreightChipState;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}

const STATE_TOKENS: Record<
  FreightChipState,
  {
    bg: string;
    color: string;
    borderColor: string;
    fontWeight: number;
    glyph: ReactNode | null;
    glyphLabel: string | null;
    strikethrough: boolean;
  }
> = {
  neutral: {
    bg: 'background.paper',
    color: 'text.primary',
    borderColor: 'grey.200',
    fontWeight: 500,
    glyph: null,
    glyphLabel: null,
    strikethrough: false,
  },
  on: {
    bg: 'primary.dark',
    color: 'common.white',
    borderColor: 'primary.dark',
    fontWeight: 600,
    glyph: <CheckOutlined sx={{ fontSize: 13 }} />,
    glyphLabel: 'Preferred',
    strikethrough: false,
  },
  avoid: {
    bg: 'rgba(254, 226, 226, 1)',
    color: 'rgba(127, 29, 29, 1)',
    borderColor: 'error.main',
    fontWeight: 600,
    glyph: <BlockOutlined sx={{ fontSize: 13 }} />,
    glyphLabel: 'Avoided',
    strikethrough: true,
  },
};

const ARIA_STATE: Record<FreightChipState, string> = {
  neutral: 'neutral',
  on: 'preferred',
  avoid: 'avoided',
};

const FreightChip: React.FC<FreightChipProps> = ({ state, label, icon, onClick }) => {
  const tokens = STATE_TOKENS[state];
  const ariaState = ARIA_STATE[state];

  return (
    <ButtonBase
      onClick={onClick}
      aria-label={`${label} — ${ariaState}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.875,
        border: '1.5px solid',
        borderColor: tokens.borderColor,
        bgcolor: tokens.bg,
        color: tokens.color,
        borderRadius: '999px',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: tokens.fontWeight,
        transition: 'all 0.15s ease',
        textDecoration: tokens.strikethrough ? 'line-through' : 'none',
        textDecorationThickness: tokens.strikethrough ? '1.5px' : undefined,
        '& svg': { fontSize: 14 },
        '&:hover': state === 'neutral' ? { borderColor: 'grey.300' } : undefined,
      }}
    >
      {tokens.glyph ? (
        <span aria-hidden style={{ display: 'inline-flex' }}>
          {tokens.glyph}
        </span>
      ) : null}
      {icon}
      {label}
    </ButtonBase>
  );
};

export default FreightChip;
