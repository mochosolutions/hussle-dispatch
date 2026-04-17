export const DRIVER_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Load History', value: 'load-history' },
  { label: 'Preferences', value: 'preferences' },
  { label: 'Schedule', value: 'schedule' },
  { label: 'Documents', value: 'documents' },
];

export const DRIVER_LIST_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
];

import type { ChipColor } from 'types/chipColor';

export const DRIVER_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  on_load: 'On Load',
  inactive: 'Inactive',
  off_duty: 'Off Duty',
};

export const DRIVER_STATUS_COLORS: Record<string, ChipColor> = {
  active: 'success',
  on_load: 'primary',
  inactive: 'default',
  off_duty: 'warning',
};
