import { useMemo, useState } from 'react';
import { Box, Button, Chip, Stack } from '@mui/material';
import {
  addDays,
  addWeeks,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { FieldLabel } from 'components/Typography';
import { FilterBarDateRange } from 'components/FilterBar/FilterBarDateRange';

export interface DispatchBoardDateFilterProps {
  dateFrom?: string;
  dateTo?: string;
  onChange: (from: Date | null, to: Date | null) => void;
}

type Mode = 'none' | 'week' | 'day' | 'custom';

const WEEK_OPTS = { weekStartsOn: 1 } as const; // Monday
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const mondayOf = (base: Date): Date => startOfWeek(base, WEEK_OPTS);

export const DispatchBoardDateFilter: React.FC<DispatchBoardDateFilterProps> = ({
  dateFrom,
  dateTo,
  onChange,
}) => {
  const [mode, setMode] = useState<Mode>(() => (dateFrom || dateTo ? 'custom' : 'none'));
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const dayChips = useMemo(
    () => DAY_LETTERS.map((letter, index) => ({ letter, date: addDays(weekStart, index), index })),
    [weekStart],
  );

  const applyWeek = (offset: number) => {
    const start = mondayOf(addWeeks(new Date(), offset));
    setWeekStart(start);
    setSelectedDay(null);
    setMode('week');
    onChange(start, endOfWeek(start, WEEK_OPTS));
  };

  const isActiveWeek = (offset: number): boolean => {
    if (mode !== 'week') {
      return false;
    }
    return weekStart.getTime() === mondayOf(addWeeks(new Date(), offset)).getTime();
  };

  const handleDayClick = (index: number, date: Date) => {
    // Re-tapping the active day reverts to the whole anchor week.
    if (mode === 'day' && selectedDay === index) {
      setSelectedDay(null);
      setMode('week');
      onChange(weekStart, endOfWeek(weekStart, WEEK_OPTS));
      return;
    }
    setSelectedDay(index);
    setMode('day');
    onChange(startOfDay(date), endOfDay(date));
  };

  const handleCustomChange = (from: Date | null, to: Date | null) => {
    setMode(from || to ? 'custom' : 'none');
    setSelectedDay(null);
    onChange(from ? startOfDay(from) : null, to ? endOfDay(to) : null);
  };

  const handleClear = () => {
    setMode('none');
    setSelectedDay(null);
    setWeekStart(mondayOf(new Date()));
    onChange(null, null);
  };

  const customFrom = mode === 'custom' && dateFrom ? new Date(dateFrom) : null;
  const customTo = mode === 'custom' && dateTo ? new Date(dateTo) : null;
  const hasFilter = Boolean(dateFrom || dateTo);

  return (
    <Stack spacing={0.5}>
      <FieldLabel>Schedule</FieldLabel>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant={isActiveWeek(0) ? 'contained' : 'outlined'}
          onClick={() => applyWeek(0)}
        >
          This Week
        </Button>
        <Button
          size="small"
          variant={isActiveWeek(1) ? 'contained' : 'outlined'}
          onClick={() => applyWeek(1)}
        >
          Next Week
        </Button>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {dayChips.map(({ letter, date, index }) => (
            <Chip
              key={date.toISOString()}
              label={`${letter} ${date.getDate()}`}
              size="small"
              color={mode === 'day' && selectedDay === index ? 'primary' : 'default'}
              variant={mode === 'day' && selectedDay === index ? 'filled' : 'outlined'}
              onClick={() => handleDayClick(index, date)}
              sx={{ height: 24 }}
            />
          ))}
        </Box>

        <FilterBarDateRange
          type="dateRange"
          name="scheduleRange"
          label="Custom"
          from={customFrom}
          to={customTo}
          onChange={handleCustomChange}
        />

        {hasFilter && (
          <Button size="small" color="inherit" onClick={handleClear}>
            Clear
          </Button>
        )}
      </Stack>
    </Stack>
  );
};
