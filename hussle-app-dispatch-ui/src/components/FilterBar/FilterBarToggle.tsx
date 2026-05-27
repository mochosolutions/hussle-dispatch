import type { ChangeEvent } from 'react';

import { FormControlLabel, Switch } from '@mui/material';

import { Body } from 'components/Typography';
import type { ToggleFilterConfig } from './filterBarTypes';

export const FilterBarToggle: React.FC<ToggleFilterConfig> = ({
  name,
  label,
  checked,
  onChange,
}) => {
  const handleChange = (_event: ChangeEvent<HTMLInputElement>, isChecked: boolean) => {
    onChange(isChecked);
  };

  return (
    <FormControlLabel
      control={<Switch name={name} checked={checked} onChange={handleChange} size="small" />}
      label={<Body>{label}</Body>}
    />
  );
};
