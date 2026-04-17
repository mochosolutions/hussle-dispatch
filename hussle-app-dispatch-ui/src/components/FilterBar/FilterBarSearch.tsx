import type { SxProps, Theme } from '@mui/material/styles';

import DebouncedInput from 'mocho/components/DebouncedInput';
import type { SearchConfig } from './filterBarTypes';

interface FilterBarSearchProps extends SearchConfig {
  sx?: SxProps<Theme>;
}

const DEFAULT_DEBOUNCE = 300;

export const FilterBarSearch: React.FC<FilterBarSearchProps> = ({
  placeholder,
  value,
  onChange,
  debounce = DEFAULT_DEBOUNCE,
  sx,
}) => (
  <DebouncedInput
    value={value}
    onFilterChange={onChange}
    debounce={debounce}
    placeholder={placeholder}
    size="small"
    sx={sx}
  />
);
