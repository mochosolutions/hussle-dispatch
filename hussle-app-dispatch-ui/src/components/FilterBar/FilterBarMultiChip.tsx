import { Box, Chip, FormControl, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

import { FieldLabel } from 'components/Typography';
import type { MultiChipFilterConfig } from './filterBarTypes';

export const FilterBarMultiChip: React.FC<MultiChipFilterConfig> = ({
  name,
  label,
  options,
  value,
  onChange,
}) => {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const selected = event.target.value;
    onChange(typeof selected === 'string' ? selected.split(',') : selected);
  };

  const labelMap = new Map(options.map((opt) => [opt.value, opt.label]));

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <FieldLabel>{label}</FieldLabel>
      <Select
        name={name}
        multiple
        value={value}
        onChange={handleChange}
        size="small"
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((val) => (
              <Chip key={val} label={labelMap.get(val) ?? val} size="small" />
            ))}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
