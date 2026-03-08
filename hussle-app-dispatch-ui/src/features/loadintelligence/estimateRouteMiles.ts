import type { Location, Stop } from './types';

// Symmetric city-to-city distances (miles). Keys are lowercase city names.
const CITY_DISTANCES: Record<string, Record<string, number>> = {
  chicago: {
    dallas: 925,
    newark: 790,
    atlanta: 720,
    'jersey city': 785,
    charlotte: 760,
    patterson: 800,
    raleigh: 740,
    houston: 1090,
    'san antonio': 1180,
    'los angeles': 2020,
    denver: 1000,
    edison: 780,
    nashville: 480,
    seattle: 2060,
    phoenix: 1750,
  },
  dallas: {
    newark: 1530,
    atlanta: 780,
    'jersey city': 1525,
    charlotte: 1060,
    patterson: 1540,
    raleigh: 1200,
    houston: 240,
    'san antonio': 275,
    'los angeles': 1440,
    denver: 780,
    edison: 1520,
    nashville: 660,
    seattle: 2170,
    phoenix: 1065,
  },
  newark: {
    atlanta: 870,
    'jersey city': 10,
    charlotte: 540,
    patterson: 20,
    raleigh: 490,
    houston: 1630,
    'san antonio': 1800,
    'los angeles': 2790,
    denver: 1780,
    edison: 30,
    nashville: 890,
    seattle: 2850,
    phoenix: 2400,
  },
  atlanta: {
    'jersey city': 865,
    charlotte: 245,
    patterson: 875,
    raleigh: 410,
    houston: 790,
    'san antonio': 920,
    'los angeles': 2200,
    denver: 1400,
    edison: 860,
    nashville: 250,
    seattle: 2640,
    phoenix: 1800,
  },
  'jersey city': {
    charlotte: 535,
    patterson: 15,
    raleigh: 485,
    houston: 1625,
    'san antonio': 1795,
    'los angeles': 2785,
    denver: 1775,
    edison: 25,
    nashville: 885,
    seattle: 2845,
    phoenix: 2395,
  },
  charlotte: {
    patterson: 545,
    raleigh: 170,
    houston: 990,
    'san antonio': 1140,
    'los angeles': 2520,
    denver: 1530,
    edison: 530,
    nashville: 400,
    seattle: 2680,
    phoenix: 2100,
  },
  patterson: {
    raleigh: 500,
    houston: 1640,
    'san antonio': 1810,
    'los angeles': 2800,
    denver: 1790,
    edison: 35,
    nashville: 900,
    seattle: 2860,
    phoenix: 2410,
  },
  raleigh: {
    houston: 1180,
    'san antonio': 1350,
    'los angeles': 2530,
    denver: 1600,
    edison: 480,
    nashville: 540,
    seattle: 2750,
    phoenix: 2200,
  },
  houston: {
    'san antonio': 200,
    'los angeles': 1550,
    denver: 1030,
    edison: 1620,
    nashville: 790,
    seattle: 2340,
    phoenix: 1180,
  },
  'san antonio': {
    'los angeles': 1360,
    denver: 940,
    edison: 1790,
    nashville: 930,
    seattle: 2000,
    phoenix: 840,
  },
  'los angeles': {
    denver: 1020,
    edison: 2780,
    nashville: 2000,
    seattle: 1140,
    phoenix: 370,
  },
  denver: {
    edison: 1770,
    nashville: 1060,
    seattle: 1320,
    phoenix: 600,
  },
  edison: {
    nashville: 880,
    seattle: 2840,
    phoenix: 2390,
  },
  nashville: {
    seattle: 2300,
    phoenix: 1650,
  },
  seattle: {
    phoenix: 1420,
  },
};

const lookupDistance = (cityA: string, cityB: string): number | null => {
  const a = cityA.toLowerCase();
  const b = cityB.toLowerCase();

  if (a === b) {
    return 0;
  }

  return CITY_DISTANCES[a]?.[b] ?? CITY_DISTANCES[b]?.[a] ?? null;
};

// Rough fallback based on zip prefix difference (very approximate)
const zipFallback = (zipA: string, zipB: string): number => {
  const prefixA = parseInt(zipA.slice(0, 3), 10);
  const prefixB = parseInt(zipB.slice(0, 3), 10);

  if (Number.isNaN(prefixA) || Number.isNaN(prefixB)) {
    return 500;
  }

  return Math.abs(prefixA - prefixB) * 4;
};

export const estimateLegMiles = (from: Location, to: Location): number => {
  const known = lookupDistance(from.city, to.city);

  if (known !== null) {
    return known;
  }

  return zipFallback(from.zip, to.zip);
};

export const estimateRouteMiles = (stops: Stop[]): number => {
  if (stops.length < 2) {
    return 0;
  }

  let total = 0;

  stops.forEach((stop, i) => {
    if (i === 0) {
      return;
    }
    total += estimateLegMiles(stops[i - 1].location, stop.location);
  });

  return total;
};
