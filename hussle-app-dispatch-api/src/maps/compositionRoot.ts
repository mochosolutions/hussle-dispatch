import type { RequestHandler } from 'express';
import type { MapTileProviderPort } from '@/shared/providers/awsLocationProviderTypes';
import type { Logger } from '@/shared/utils/logger';
import {
  createStyleController,
  createTileController,
  createSpriteController,
  createGlyphsController,
} from './controllers/mapTileController';

interface MapsModuleDeps {
  mapTileProvider: MapTileProviderPort;
  mapName: string;
  logger: Logger;
}

export interface MapsModuleControllers {
  style: RequestHandler;
  tile: RequestHandler;
  sprite: RequestHandler;
  glyphs: RequestHandler;
}

export const createMapsModule = (deps: MapsModuleDeps): {
  controllers: MapsModuleControllers;
} => {
  const controllerDeps = {
    mapTileProvider: deps.mapTileProvider,
    mapName: deps.mapName,
    logger: deps.logger,
  };

  const controllers: MapsModuleControllers = {
    style: createStyleController(controllerDeps),
    tile: createTileController(controllerDeps),
    sprite: createSpriteController(controllerDeps),
    glyphs: createGlyphsController(controllerDeps),
  };

  return { controllers };
};
