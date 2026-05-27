import { Box, ButtonBase } from '@mui/material';

import { BodyStrong, Meta } from 'components/Typography';

export type ScheduleState = 'on' | 'flex' | 'off';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type WeeklySchedule = Record<DayKey, ScheduleState>;

interface ScheduleGridProps {
  value: WeeklySchedule;
  onChange: (next: WeeklySchedule) => void;
  rowLabel?: string;
  offLabel?: string;
}

const DAYS: { key: DayKey; head: string; letter: string }[] = [
  { key: 'mon', head: 'Mon', letter: 'M' },
  { key: 'tue', head: 'Tue', letter: 'T' },
  { key: 'wed', head: 'Wed', letter: 'W' },
  { key: 'thu', head: 'Thu', letter: 'T' },
  { key: 'fri', head: 'Fri', letter: 'F' },
  { key: 'sat', head: 'Sat', letter: 'S' },
  { key: 'sun', head: 'Sun', letter: 'S' },
];

const STATUS_LABEL: Record<ScheduleState, string> = {
  on: 'On',
  flex: 'Flex',
  off: 'Off',
};

const CYCLE: Record<ScheduleState, ScheduleState> = {
  on: 'flex',
  flex: 'off',
  off: 'on',
};

const STATE_TOKENS: Record<
  ScheduleState,
  {
    bg: string;
    borderColor: string;
    labelColor: string;
    statusColor: string;
    opacity?: number;
    strikethrough?: boolean;
  }
> = {
  on: {
    bg: 'rgba(220, 252, 231, 1)',
    borderColor: 'success.main',
    labelColor: 'rgba(6, 78, 59, 1)',
    statusColor: 'success.main',
  },
  flex: {
    bg: 'rgba(255, 247, 237, 1)',
    borderColor: 'warning.main',
    labelColor: 'rgba(120, 53, 15, 1)',
    statusColor: 'warning.main',
  },
  off: {
    bg: 'grey.100',
    borderColor: 'grey.200',
    labelColor: 'text.secondary',
    statusColor: 'text.secondary',
    opacity: 0.65,
    strikethrough: true,
  },
};

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  value,
  onChange,
  rowLabel = 'Available',
  offLabel,
}) => {
  const handleCycle = (day: DayKey) => {
    onChange({ ...value, [day]: CYCLE[value[day]] });
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '60px repeat(7, 1fr)',
        gap: 0.75,
        p: 1.5,
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 0.75,
        alignItems: 'stretch',
      }}
    >
      <Box />
      {DAYS.map((day) => (
        <Box
          key={`head-${day.key}`}
          sx={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'text.secondary',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 0.5,
          }}
        >
          {day.head}
        </Box>
      ))}

      <Box
        sx={{
          fontSize: 11.5,
          fontWeight: 600,
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          pr: 0.75,
        }}
      >
        {rowLabel}
      </Box>
      {DAYS.map((day) => {
        const state = value[day.key];
        const tokens = STATE_TOKENS[state];
        const statusText = state === 'off' && offLabel ? offLabel : STATUS_LABEL[state];
        return (
          <ButtonBase
            key={day.key}
            onClick={() => handleCycle(day.key)}
            aria-label={`${day.head} — ${statusText}`}
            sx={{
              border: '1.5px solid',
              borderColor: tokens.borderColor,
              bgcolor: tokens.bg,
              borderRadius: 0.5,
              px: 0.75,
              py: 1,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.25,
              minHeight: 48,
              opacity: tokens.opacity ?? 1,
              transition: 'all 0.12s ease',
              '&:hover': { boxShadow: '0 0 0 2px rgba(15, 23, 42, 0.04)' },
            }}
          >
            <BodyStrong
              sx={{
                fontSize: 14,
                fontWeight: 700,
                color: tokens.labelColor,
                textDecoration: tokens.strikethrough ? 'line-through' : 'none',
              }}
            >
              {day.letter}
            </BodyStrong>
            <Meta
              sx={{
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: tokens.statusColor,
              }}
            >
              {statusText}
            </Meta>
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default ScheduleGrid;
