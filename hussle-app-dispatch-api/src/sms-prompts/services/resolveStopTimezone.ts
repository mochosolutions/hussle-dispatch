/**
 * US state -> primary IANA timezone. For states that span multiple time zones,
 * a city-disambiguation table overrides the primary mapping.
 */
const STATE_TZ: Record<string, string> = {
  AL: 'America/Chicago',
  AK: 'America/Anchorage',
  AZ: 'America/Phoenix',
  AR: 'America/Chicago',
  CA: 'America/Los_Angeles',
  CO: 'America/Denver',
  CT: 'America/New_York',
  DE: 'America/New_York',
  DC: 'America/New_York',
  FL: 'America/New_York',
  GA: 'America/New_York',
  HI: 'Pacific/Honolulu',
  ID: 'America/Boise',
  IL: 'America/Chicago',
  IN: 'America/Indiana/Indianapolis',
  IA: 'America/Chicago',
  KS: 'America/Chicago',
  KY: 'America/New_York',
  LA: 'America/Chicago',
  ME: 'America/New_York',
  MD: 'America/New_York',
  MA: 'America/New_York',
  MI: 'America/Detroit',
  MN: 'America/Chicago',
  MS: 'America/Chicago',
  MO: 'America/Chicago',
  MT: 'America/Denver',
  NE: 'America/Chicago',
  NV: 'America/Los_Angeles',
  NH: 'America/New_York',
  NJ: 'America/New_York',
  NM: 'America/Denver',
  NY: 'America/New_York',
  NC: 'America/New_York',
  ND: 'America/Chicago',
  OH: 'America/New_York',
  OK: 'America/Chicago',
  OR: 'America/Los_Angeles',
  PA: 'America/New_York',
  RI: 'America/New_York',
  SC: 'America/New_York',
  SD: 'America/Chicago',
  TN: 'America/Chicago',
  TX: 'America/Chicago',
  UT: 'America/Denver',
  VT: 'America/New_York',
  VA: 'America/New_York',
  WA: 'America/Los_Angeles',
  WV: 'America/New_York',
  WI: 'America/Chicago',
  WY: 'America/Denver',
};

// City-level overrides for states that span multiple timezones.
// Keys are normalized: lowercase + state code, e.g. "knoxville:TN".
const CITY_OVERRIDES: Record<string, string> = {
  // Tennessee — split between Eastern (east of plateau) and Central
  'knoxville:TN': 'America/New_York',
  'chattanooga:TN': 'America/New_York',
  'kingsport:TN': 'America/New_York',
  'johnson city:TN': 'America/New_York',
  'oak ridge:TN': 'America/New_York',
  'bristol:TN': 'America/New_York',
  // Kentucky — eastern half is Eastern, western half (Louisville etc.) is Eastern,
  // far western (Paducah, Bowling Green) is Central.
  'paducah:KY': 'America/Chicago',
  'bowling green:KY': 'America/Chicago',
  'hopkinsville:KY': 'America/Chicago',
  'owensboro:KY': 'America/Chicago',
  // Indiana — most counties Eastern; a few NW + SW are Central.
  'gary:IN': 'America/Chicago',
  'hammond:IN': 'America/Chicago',
  'evansville:IN': 'America/Chicago',
  // Florida panhandle is Central.
  'pensacola:FL': 'America/Chicago',
  // Texas El Paso area is Mountain.
  'el paso:TX': 'America/Denver',
  // Oregon eastern is Mountain.
  'ontario:OR': 'America/Denver',
  // Idaho northern panhandle is Pacific.
  "coeur d'alene:ID": 'America/Los_Angeles',
  'sandpoint:ID': 'America/Los_Angeles',
  // North Dakota western is Mountain.
  'dickinson:ND': 'America/Denver',
  // South Dakota western is Mountain.
  'rapid city:SD': 'America/Denver',
  // Nebraska western is Mountain.
  'scottsbluff:NE': 'America/Denver',
  // Kansas western is Mountain.
  'goodland:KS': 'America/Denver',
};

export const resolveStopTimezone = (
  city: string | null,
  state: string | null,
): string | null => {
  if (state === null || state.trim() === '') {
    return null;
  }
  const stateCode = state.trim().toUpperCase();

  if (city !== null && city.trim() !== '') {
    const key = `${city.trim().toLowerCase()}:${stateCode}`;
    const override = CITY_OVERRIDES[key];
    if (override !== undefined) {
      return override;
    }
  }

  return STATE_TZ[stateCode] ?? null;
};
