import type { ChangeEvent } from 'react';

import { Stack, TextField } from '@mui/material';

import { FieldLabel } from 'components/Typography';
import type { DateRangeFilterConfig } from './filterBarTypes';

const formatDateForInput = (date: Date | null): string => {
  if (date === null) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string): Date | null => {
  if (value === '') {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

export const FilterBarDateRange: React.FC<DateRangeFilterConfig> = ({
  label,
  from,
  to,
  onChange,
}) => {
  const handleFromChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(parseDateInput(event.target.value), to);
  };

  const handleToChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(from, parseDateInput(event.target.value));
  };

  return (
    <Stack spacing={0.5}>
      <FieldLabel>{label}</FieldLabel>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          type="date"
          size="small"
          value={formatDateForInput(from)}
          onChange={handleFromChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ 'aria-label': `${label} from` }}
        />
        <TextField
          type="date"
          size="small"
          value={formatDateForInput(to)}
          onChange={handleToChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ 'aria-label': `${label} to` }}
        />
      </Stack>
    </Stack>
  );
};
