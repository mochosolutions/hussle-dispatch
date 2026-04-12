import type { Driver } from '@prisma/client';
import type Redis from 'ioredis';
import type { CityCoords } from '@/shared/geoLookup';

export type DeadheadSource = 'coordinates' | 'geocoded';

export interface DeadheadToResult {
  deadheadMiles: number | null;
  isEstimated: boolean;
  source: DeadheadSource | null;
}

export interface DeadheadToServiceInput {
  driverId: string;
  organizationId: string;
  role: string;
  targetLat: number;
  targetLng: number;
}

export interface DeadheadToServiceDeps {
  findDriver: (id: string, organizationId: string) => Promise<Driver | null>;
  getCityCoords: (redis: Redis, state: string, city: string) => Promise<CityCoords | null>;
  redis: Redis;
}
