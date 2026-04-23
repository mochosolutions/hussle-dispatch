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

export const PAY_TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage of Load' },
  { value: 'PER_MILE', label: 'Per Mile' },
  { value: 'PER_HOUR', label: 'Per Hour' },
  { value: 'FLAT_RATE', label: 'Flat Rate' },
];

export const PAY_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Percentage',
  PER_MILE: 'Per Mile',
  PER_HOUR: 'Per Hour',
  FLAT_RATE: 'Flat Rate',
};

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
