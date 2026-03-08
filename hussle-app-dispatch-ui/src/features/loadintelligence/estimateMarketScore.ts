import type { LoadMarket } from './types';

// Seeded from existing mock data market scores
const MOCK_MARKET_SCORES: Record<string, number> = {
  Chicago: 82,
  Dallas: 88,
  Newark: 71,
  Atlanta: 91,
  'Jersey City': 58,
  Charlotte: 62,
  Patterson: 45,
  Raleigh: 55,
  Houston: 34,
  'San Antonio': 38,
  'Los Angeles': 76,
  Denver: 72,
  Edison: 52,
  Nashville: 85,
  Seattle: 89,
  Phoenix: 47,
};

// Deterministic fallback: hash the city name to a score in 30–80 range
const fallbackScore = (city: string): number => {
  let hash = 0;

  city.split('').forEach((ch) => {
    hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  });

  return 30 + (Math.abs(hash) % 51);
};

export const estimateMarketScore = (city: string): LoadMarket => {
  const score = MOCK_MARKET_SCORES[city] ?? fallbackScore(city);

  return { city, score };
};
