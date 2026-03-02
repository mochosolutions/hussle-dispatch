import fs from 'fs';
import path from 'path';
import type Redis from 'ioredis';

const GEO_CITIES_KEY = 'geo:cities';

/**
 * Reads data/us-cities.csv from the repository root and bulk-loads city centroids
 * into the Redis geo:cities hash.
 *
 * CSV format: state,city,lat,lng
 * Redis field format: '{STATE}:{city_lowercase}' — value: '{lat},{lng}'
 *
 * Safe to call at every API startup — it overwrites existing data with current CSV content.
 */
export const runGeoBootstrap = async (redis: Redis): Promise<void> => {
  const csvPath = path.resolve(__dirname, '../../../../data/us-cities.csv');

  if (!fs.existsSync(csvPath)) {
    process.stderr.write(`[geoBootstrap] CSV not found at ${csvPath} — skipping\n`);
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim().length > 0);

  // Skip header row
  const dataLines = lines[0]?.startsWith('state') ? lines.slice(1) : lines;

  const pipeline = redis.pipeline();

  dataLines.forEach((line) => {
    const parts = line.split(',');
    if (parts.length < 4) {
      return;
    }

    const state = parts[0]?.trim();
    const city = parts[1]?.trim();
    const lat = parts[2]?.trim();
    const lng = parts[3]?.trim();

    if (!state || !city || !lat || !lng) {
      return;
    }

    const field = `${state.toUpperCase()}:${city.toLowerCase()}`;
    const value = `${lat},${lng}`;

    pipeline.hset(GEO_CITIES_KEY, field, value);
  });

  await pipeline.exec();

  process.stdout.write(
    `[geoBootstrap] Loaded ${dataLines.length} city centroids into Redis\n`,
  );
};
