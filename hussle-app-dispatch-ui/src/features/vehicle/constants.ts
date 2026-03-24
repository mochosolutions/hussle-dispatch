import type { ChipColor } from 'types/chipColor';
import type { VehicleType, VehicleOwnership } from 'features/carrier/types';

export const VEHICLE_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Expenses', value: 'expenses' },
  { label: 'Load History', value: 'load-history' },
  { label: 'Documents', value: 'documents' },
];

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  FIXED: 'Fixed',
  VARIABLE: 'Variable',
  SERVICE: 'Service',
  WAGE: 'Wage',
  DEDUCTION: 'Deduction',
};

export const VEHICLE_LIST_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Owned', value: 'OWNED' },
  { label: 'Leased', value: 'LEASED' },
];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  DRY_VAN: 'Dry Van',
  REEFER: 'Reefer',
  FLATBED: 'Flatbed',
  STEP_DECK: 'Step Deck',
  BOX_TRUCK: 'Box Truck',
  HOTSHOT: 'Hotshot',
  POWER_ONLY: 'Power Only',
};

export const OWNERSHIP_LABELS: Record<VehicleOwnership, string> = {
  OWNED: 'Owned',
  LEASED: 'Leased',
};

export const VEHICLE_LOAD_STATUS_COLORS: Record<string, ChipColor> = {
  DELIVERED: 'success',
  IN_TRANSIT: 'primary',
  BOOKED: 'info',
};
