import type { SxProps, Theme } from '@mui/material/styles';

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseFilterConfig {
  name: string;
  label: string;
}

export interface SelectFilterConfig extends BaseFilterConfig {
  type: 'select';
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface MultiChipFilterConfig extends BaseFilterConfig {
  type: 'multiSelectChip';
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export interface DateRangeFilterConfig extends BaseFilterConfig {
  type: 'dateRange';
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
}

export interface ToggleFilterConfig extends BaseFilterConfig {
  type: 'toggle';
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export type FilterConfig =
  | SelectFilterConfig
  | MultiChipFilterConfig
  | DateRangeFilterConfig
  | ToggleFilterConfig;

export interface SearchConfig {
  placeholder: string;
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
}

export interface FilterBarProps {
  filters: FilterConfig[];
  search?: SearchConfig;
  sx?: SxProps<Theme>;
}
