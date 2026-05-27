import { Stack } from '@mui/material';

import type { FilterBarProps, FilterConfig } from './filterBarTypes';
import { FilterBarSelect } from './FilterBarSelect';
import { FilterBarMultiChip } from './FilterBarMultiChip';
import { FilterBarDateRange } from './FilterBarDateRange';
import { FilterBarToggle } from './FilterBarToggle';
import { FilterBarSearch } from './FilterBarSearch';

const renderFilter = (filter: FilterConfig) => {
  switch (filter.type) {
    case 'select':
      return <FilterBarSelect key={filter.name} {...filter} />;
    case 'multiSelectChip':
      return <FilterBarMultiChip key={filter.name} {...filter} />;
    case 'dateRange':
      return <FilterBarDateRange key={filter.name} {...filter} />;
    case 'toggle':
      return <FilterBarToggle key={filter.name} {...filter} />;
    default:
      return null;
  }
};

export const FilterBar: React.FC<FilterBarProps> = ({ filters, search, sx }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={2}
    alignItems="flex-end"
    flexWrap="wrap"
    sx={sx}
  >
    {filters.map(renderFilter)}
    {search && <FilterBarSearch {...search} sx={{ ml: 'auto' }} />}
  </Stack>
);

export default FilterBar;
