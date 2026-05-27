import { createMapsModule } from './compositionRoot';
import { mapRoutes } from './routes/mapRoutes';
import { createAwsLocationProvider } from '@/shared/providers/awsLocationProvider';
import { env } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import type { MapTileProviderPort } from '@/shared/providers/awsLocationProviderTypes';

const notConfiguredError = () => Promise.reject(new Error('Map service not configured'));

const stubProvider: MapTileProviderPort = {
  getStyleDescriptor: () => notConfiguredError(),
  getMapTile: () => notConfiguredError(),
  getSprites: () => notConfiguredError(),
  getGlyphs: () => notConfiguredError(),
};

const locationProvider: MapTileProviderPort = env.AWS_LOCATION_MAP_NAME
  ? createAwsLocationProvider()
  : stubProvider;

const mapsModule = createMapsModule({
  mapTileProvider: locationProvider,
  mapName: env.AWS_LOCATION_MAP_NAME,
  logger,
});

export const mapsRouter = mapRoutes(mapsModule.controllers);
