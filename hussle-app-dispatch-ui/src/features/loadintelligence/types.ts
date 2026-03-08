export type EquipmentType = 'DV' | 'RF' | 'FB' | 'SD';

export type SourceType = 'DAT' | 'Bulk' | 'Manual';

export type ScoreTier = 'All' | 'Excellent' | 'Good' | 'Fair' | 'Pass';

export interface LoadSource {
  id: string;
  name: string;
  type: SourceType;
  dateAdded: string;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface LoadCarrier {
  id: string;
  name: string;
}

export interface LoadCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface LoadMarket {
  city: string;
  score: number;
}

export interface MockLoad {
  id: string;
  externalId?: string;
  score: number;
  chainScore: number | null;
  chainCount: number;
  status: string;
  rate: number | null;
  minRate: number | null;
  miles: number;
  equipmentType: EquipmentType;
  source: LoadSource;
  origin: Location;
  destination: Location;
  carrier: LoadCarrier;
  customer: LoadCustomer;
  market: LoadMarket;
  destinationMarket: LoadMarket;
  pickupStops: number;
  dropStops: number;
  pickupDate: string;
  vsMinimum: number | null;
}

export interface MockDriver {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  currentCity: string;
  currentState: string;
}

export interface Stop {
  id: string;
  type: 'pickup' | 'dropoff';
  location: Location;
  commodity: string;
  weight: number | null;
}

export interface WorkspaceRoute {
  stops: Stop[];
  totalMiles: number;
  totalWeight: number;
  originMarket: LoadMarket;
  destinationMarket: LoadMarket;
}

export interface LoadFilters {
  score: ScoreTier;
  equipment: 'All' | EquipmentType;
  source: 'All' | SourceType;
}
