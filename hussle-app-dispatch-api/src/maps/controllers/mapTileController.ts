import type { Request, Response } from 'express';
import type { MapTileProviderPort } from '@/shared/providers/awsLocationProviderTypes';
import type { Logger } from '@/shared/utils/logger';

interface MapTileControllerDeps {
  mapTileProvider: MapTileProviderPort;
  mapName: string;
  logger: Logger;
}

interface TileSource {
  tiles?: string[];
  url?: string;
}

interface StyleDescriptor {
  sources?: Record<string, TileSource>;
  sprite?: string;
  glyphs?: string;
}

const mapNotConfigured = (deps: MapTileControllerDeps, res: Response): boolean => {
  if (!deps.mapName) {
    res.status(503).json({ errors: [{ message: 'Map service not configured' }] });
    return true;
  }
  return false;
};

export const createStyleController = (deps: MapTileControllerDeps) =>
  async (req: Request, res: Response) => {
    if (mapNotConfigured(deps, res)) {
      return;
    }

    const result = await deps.mapTileProvider.getStyleDescriptor(deps.mapName);

    const styleJson: StyleDescriptor = JSON.parse(Buffer.from(result.body).toString('utf-8'));
    const protocol = req.protocol;
    const host = req.get('host') ?? 'localhost:3001';
    const baseUrl = `${protocol}://${host}/api/v1/maps`;

    if (styleJson.sources) {
      Object.values(styleJson.sources).forEach((source) => {
        if (source.tiles) {
          source.tiles = source.tiles.map(() => `${baseUrl}/tiles/{z}/{x}/{y}`);
        }
        if (source.url) {
          delete source.url;
        }
      });
    }

    if (styleJson.sprite) {
      styleJson.sprite = `${baseUrl}/sprites/sprites`;
    }

    if (styleJson.glyphs) {
      styleJson.glyphs = `${baseUrl}/glyphs/{fontstack}/{range}.pbf`;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(styleJson);
  };

export const createTileController = (deps: MapTileControllerDeps) =>
  async (req: Request, res: Response) => {
    if (mapNotConfigured(deps, res)) {
      return;
    }

    const { z, x, y } = req.params;

    if (!z || !x || !y) {
      res.status(400).json({ errors: [{ message: 'Missing tile coordinates' }] });
      return;
    }

    const result = await deps.mapTileProvider.getMapTile(deps.mapName, { z, x, y });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(result.body));
  };

export const createSpriteController = (deps: MapTileControllerDeps) =>
  async (req: Request, res: Response) => {
    if (mapNotConfigured(deps, res)) {
      return;
    }

    const { fileName } = req.params;

    if (!fileName) {
      res.status(400).json({ errors: [{ message: 'Missing sprite file name' }] });
      return;
    }

    const result = await deps.mapTileProvider.getSprites(deps.mapName, fileName);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(result.body));
  };

export const createGlyphsController = (deps: MapTileControllerDeps) =>
  async (req: Request, res: Response) => {
    if (mapNotConfigured(deps, res)) {
      return;
    }

    const { fontstack, range } = req.params;

    if (!fontstack || !range) {
      res.status(400).json({ errors: [{ message: 'Missing glyph parameters' }] });
      return;
    }

    const result = await deps.mapTileProvider.getGlyphs(deps.mapName, fontstack, range);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(result.body));
  };
