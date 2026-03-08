import type { Driver, Vehicle } from 'features/carrier/types';
import { MOCK_DRIVERS as RAW_FLEET_DRIVERS } from 'features/driver/mockData';
import { MOCK_VEHICLES as RAW_FLEET_VEHICLES } from 'features/vehicle/mockData';

import type { MockDriver, MockLoad } from './types';

// Full Driver records sorted: available first, then alphabetical
export const FLEET_DRIVERS: Driver[] = [...RAW_FLEET_DRIVERS].sort((a, b) => {
  if (a.isAvailable !== b.isAvailable) {
    return a.isAvailable ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
});

export const FLEET_VEHICLES: Vehicle[] = RAW_FLEET_VEHICLES;

// Maps each driver ID to a vehicle ID (mock driver↔vehicle pairing)
export const MOCK_DRIVER_VEHICLE_MAP: Record<string, string> = {
  [RAW_FLEET_DRIVERS[0].id]: RAW_FLEET_VEHICLES[0].id, // Marcus Johnson → TRK-1001
  [RAW_FLEET_DRIVERS[1].id]: RAW_FLEET_VEHICLES[1].id, // Sarah Mitchell → TRK-1002
  [RAW_FLEET_DRIVERS[2].id]: RAW_FLEET_VEHICLES[2].id, // James Rivera → TRK-2001
  [RAW_FLEET_DRIVERS[3].id]: RAW_FLEET_VEHICLES[3].id, // Robert Chen → TRK-2002
  [RAW_FLEET_DRIVERS[4].id]: RAW_FLEET_VEHICLES[4].id, // Angela Washington → BX-3001
  [RAW_FLEET_DRIVERS[5].id]: RAW_FLEET_VEHICLES[5].id, // Travis Coleman → HS-3002
};

export const MOCK_DRIVERS: MockDriver[] = [
  {
    id: 'DRV-001',
    name: 'Marcus Johnson',
    initials: 'MJ',
    avatarColor: 'primary.main',
    currentCity: 'Dallas',
    currentState: 'TX',
  },
  {
    id: 'DRV-002',
    name: 'James Davis',
    initials: 'JD',
    avatarColor: 'secondary.main',
    currentCity: 'Charlotte',
    currentState: 'NC',
  },
  {
    id: 'DRV-003',
    name: 'Ray Thompson',
    initials: 'RT',
    avatarColor: 'info.main',
    currentCity: 'Atlanta',
    currentState: 'GA',
  },
  {
    id: 'DRV-004',
    name: 'Carlos Reyes',
    initials: 'CR',
    avatarColor: 'warning.main',
    currentCity: 'Phoenix',
    currentState: 'AZ',
  },
  {
    id: 'DRV-005',
    name: 'Andre Hill',
    initials: 'AH',
    avatarColor: 'success.main',
    currentCity: 'Indianapolis',
    currentState: 'IN',
  },
];

const customer = {
  id: 'C-12345',
  name: 'Acme Corporation',
  phone: '(555) 123-4567',
  email: 'dispatch@acmecorp.com',
};

const carrierSwift = { id: 'CR-001', name: 'Swift Logistics' };
const carrierFastHaul = { id: 'CR-002', name: 'FastHaul LLC' };
const carrierSunState = { id: 'CR-003', name: 'SunState Transport' };
const carrierNorthEast = { id: 'CR-004', name: 'NorthEast Carriers' };
const carrierLoneStar = { id: 'CR-005', name: 'Lone Star Freight' };

// Reference point: always "now" so relative timestamps are always in the past
const REF = new Date();

const hoursAgo = (hours: number): string =>
  new Date(REF.getTime() - hours * 60 * 60 * 1000).toISOString();

export const MOCK_LOADS: MockLoad[] = [
  {
    id: 'LD-2026-000001',
    externalId: 'DAT-88412',
    score: 94,
    chainScore: 87,
    chainCount: 3,
    status: 'New',
    rate: 3200,
    minRate: 2800,
    miles: 925,
    equipmentType: 'DV',
    source: { id: 'S-001', name: 'DAT Power', type: 'DAT', dateAdded: hoursAgo(1) },
    origin: { city: 'Chicago', state: 'IL', country: 'US', zip: '60601' },
    destination: { city: 'Dallas', state: 'TX', country: 'US', zip: '75201' },
    carrier: carrierSwift,
    customer,
    market: { city: 'Chicago', score: 82 },
    destinationMarket: { city: 'Dallas', score: 88 },
    pickupStops: 0,
    dropStops: 0,
    pickupDate: '2026-03-10',
    vsMinimum: 14.3,
  },
  {
    id: 'LD-2026-000002',
    score: 78,
    chainScore: 65,
    chainCount: 2,
    status: 'New',
    rate: null,
    minRate: 1900,
    miles: 662,
    equipmentType: 'RF',
    source: { id: 'S-002', name: 'Bulk Import', type: 'Bulk', dateAdded: hoursAgo(3) },
    origin: { city: 'Newark', state: 'NJ', country: 'US', zip: '07102' },
    destination: { city: 'Atlanta', state: 'GA', country: 'US', zip: '30303' },
    carrier: carrierNorthEast,
    customer,
    market: { city: 'Newark', score: 71 },
    destinationMarket: { city: 'Atlanta', score: 91 },
    pickupStops: 1,
    dropStops: 0,
    pickupDate: '2026-03-11',
    vsMinimum: null,
  },
  {
    id: 'LD-2026-000003',
    externalId: 'DAT-90215',
    score: 62,
    chainScore: null,
    chainCount: 0,
    status: 'New',
    rate: 1650,
    minRate: 1500,
    miles: 380,
    equipmentType: 'FB',
    source: { id: 'S-003', name: 'DAT Power', type: 'DAT', dateAdded: hoursAgo(5) },
    origin: { city: 'Jersey City', state: 'NJ', country: 'US', zip: '07302' },
    destination: { city: 'Charlotte', state: 'NC', country: 'US', zip: '28202' },
    carrier: carrierFastHaul,
    customer,
    market: { city: 'Jersey City', score: 58 },
    destinationMarket: { city: 'Charlotte', score: 62 },
    pickupStops: 0,
    dropStops: 1,
    pickupDate: '2026-03-09',
    vsMinimum: 10.0,
  },
  {
    id: 'LD-2026-000004',
    score: 41,
    chainScore: 38,
    chainCount: 1,
    status: 'Pending',
    rate: 2100,
    minRate: null,
    miles: 502,
    equipmentType: 'SD',
    source: { id: 'S-004', name: 'Manual Entry', type: 'Manual', dateAdded: hoursAgo(8) },
    origin: { city: 'Patterson', state: 'NJ', country: 'US', zip: '07501' },
    destination: { city: 'Raleigh', state: 'NC', country: 'US', zip: '27601' },
    carrier: carrierSunState,
    customer,
    market: { city: 'Patterson', score: 45 },
    destinationMarket: { city: 'Raleigh', score: 55 },
    pickupStops: 0,
    dropStops: 0,
    pickupDate: '2026-03-12',
    vsMinimum: -5.2,
  },
  {
    id: 'LD-2026-000005',
    score: 18,
    chainScore: 22,
    chainCount: 1,
    status: 'New',
    rate: 1500,
    minRate: 1800,
    miles: 245,
    equipmentType: 'DV',
    source: { id: 'S-005', name: 'DAT Power', type: 'DAT', dateAdded: hoursAgo(2) },
    origin: { city: 'Houston', state: 'TX', country: 'US', zip: '77001' },
    destination: { city: 'San Antonio', state: 'TX', country: 'US', zip: '78201' },
    carrier: carrierLoneStar,
    customer,
    market: { city: 'Houston', score: 34 },
    destinationMarket: { city: 'San Antonio', score: 38 },
    pickupStops: 0,
    dropStops: 0,
    pickupDate: '2026-03-10',
    vsMinimum: -16.7,
  },
  {
    id: 'LD-2026-000006',
    externalId: 'BLK-44201',
    score: 85,
    chainScore: 91,
    chainCount: 4,
    status: 'New',
    rate: 4200,
    minRate: 3500,
    miles: 1380,
    equipmentType: 'RF',
    source: { id: 'S-006', name: 'Bulk Import', type: 'Bulk', dateAdded: hoursAgo(4) },
    origin: { city: 'Los Angeles', state: 'CA', country: 'US', zip: '90001' },
    destination: { city: 'Denver', state: 'CO', country: 'US', zip: '80202' },
    carrier: carrierSwift,
    customer,
    market: { city: 'Los Angeles', score: 76 },
    destinationMarket: { city: 'Denver', score: 72 },
    pickupStops: 2,
    dropStops: 1,
    pickupDate: '2026-03-13',
    vsMinimum: 20.0,
  },
  {
    id: 'LD-2026-000007',
    score: 55,
    chainScore: 48,
    chainCount: 2,
    status: 'Pending',
    rate: 2750,
    minRate: 2600,
    miles: 1050,
    equipmentType: 'DV',
    source: { id: 'S-007', name: 'Manual Entry', type: 'Manual', dateAdded: hoursAgo(6) },
    origin: { city: 'Edison', state: 'NJ', country: 'US', zip: '08817' },
    destination: { city: 'Nashville', state: 'TN', country: 'US', zip: '37201' },
    carrier: carrierFastHaul,
    customer,
    market: { city: 'Edison', score: 52 },
    destinationMarket: { city: 'Nashville', score: 85 },
    pickupStops: 0,
    dropStops: 2,
    pickupDate: '2026-03-11',
    vsMinimum: 5.8,
  },
  {
    id: 'LD-2026-000008',
    externalId: 'DAT-91003',
    score: 92,
    chainScore: 88,
    chainCount: 3,
    status: 'New',
    rate: 4500,
    minRate: 3800,
    miles: 1480,
    equipmentType: 'FB',
    source: { id: 'S-008', name: 'DAT Power', type: 'DAT', dateAdded: hoursAgo(1.5) },
    origin: { city: 'Seattle', state: 'WA', country: 'US', zip: '98101' },
    destination: { city: 'Phoenix', state: 'AZ', country: 'US', zip: '85001' },
    carrier: carrierSunState,
    customer,
    market: { city: 'Seattle', score: 89 },
    destinationMarket: { city: 'Phoenix', score: 47 },
    pickupStops: 1,
    dropStops: 0,
    pickupDate: '2026-03-14',
    vsMinimum: 18.4,
  },
];
