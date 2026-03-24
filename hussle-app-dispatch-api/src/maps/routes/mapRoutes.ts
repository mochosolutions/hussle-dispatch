import { Router } from 'express';
import type { RequestHandler } from 'express';
import { mapTileRateLimiter } from '@/shared/middleware/rateLimiter';

export interface MapControllers {
  style: RequestHandler;
  tile: RequestHandler;
  sprite: RequestHandler;
  glyphs: RequestHandler;
}

export const mapRoutes = (controllers: MapControllers): Router => {
  const router = Router();

  router.get('/style.json', mapTileRateLimiter, controllers.style);
  router.get('/tiles/:z/:x/:y', mapTileRateLimiter, controllers.tile);
  router.get('/sprites/:fileName', mapTileRateLimiter, controllers.sprite);
  router.get('/glyphs/:fontstack/:range', mapTileRateLimiter, controllers.glyphs);

  return router;
};
