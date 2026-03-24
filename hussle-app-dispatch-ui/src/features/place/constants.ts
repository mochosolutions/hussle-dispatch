import type { FacilityType, DockType } from './types';

export const FACILITY_TYPE_OPTIONS: readonly { value: FacilityType; label: string }[] = [
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'DISTRIBUTION_CENTER', label: 'Distribution Center' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'COLD_STORAGE', label: 'Cold Storage' },
  { value: 'CROSS_DOCK', label: 'Cross Dock' },
  { value: 'PORT', label: 'Port' },
  { value: 'RAIL_YARD', label: 'Rail Yard' },
  { value: 'DROP_YARD', label: 'Drop Yard' },
  { value: 'TRUCK_STOP', label: 'Truck Stop' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'FARM', label: 'Farm' },
  { value: 'CONSTRUCTION_SITE', label: 'Construction Site' },
  { value: 'MILITARY', label: 'Military' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'OTHER', label: 'Other' },
];

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  WAREHOUSE: 'Warehouse',
  DISTRIBUTION_CENTER: 'Distribution Center',
  MANUFACTURING: 'Manufacturing',
  COLD_STORAGE: 'Cold Storage',
  CROSS_DOCK: 'Cross Dock',
  PORT: 'Port',
  RAIL_YARD: 'Rail Yard',
  DROP_YARD: 'Drop Yard',
  TRUCK_STOP: 'Truck Stop',
  RETAIL: 'Retail',
  FARM: 'Farm',
  CONSTRUCTION_SITE: 'Construction Site',
  MILITARY: 'Military',
  GOVERNMENT: 'Government',
  RESIDENTIAL: 'Residential',
  OTHER: 'Other',
};

export const DOCK_TYPE_OPTIONS: readonly { value: DockType; label: string }[] = [
  { value: 'DOCK_HIGH', label: 'Dock High' },
  { value: 'GROUND_LEVEL', label: 'Ground Level' },
  { value: 'BOTH', label: 'Both' },
  { value: 'NONE', label: 'None' },
];

export const DOCK_TYPE_LABELS: Record<DockType, string> = {
  DOCK_HIGH: 'Dock High',
  GROUND_LEVEL: 'Ground Level',
  BOTH: 'Both',
  NONE: 'None',
};
