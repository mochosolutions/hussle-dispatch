import { FormControl, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

import { FieldLabel } from 'components/Typography';
import type { SelectFilterConfig } from './filterBarTypes';

export const FilterBarSelect: React.FC<SelectFilterConfig> = ({
  name,
  label,
  options,
  value,
  onChange,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <FieldLabel>{label}</FieldLabel>
      <Select name={name} value={value} onChange={handleChange} size="small">
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
