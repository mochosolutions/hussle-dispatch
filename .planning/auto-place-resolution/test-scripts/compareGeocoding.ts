/**
 * Geocoding comparison: AWS Location v1 vs v2.
 *
 * Runs the same set of queries through:
 *   - v1 SearchPlaceIndexForText      (current production)
 *   - v2 SuggestCommand               (typeahead — POI-aware)
 *   - v2 SearchTextCommand            (free-form search, structured)
 *   - v2 GeocodeCommand               (deterministic geocode for storage)
 *
 * Prints a side-by-side comparison so we can see which API surfaces
 * the right data for each query type.
 *
 * Run from this directory:  npm run compare
 */
import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
} from '@aws-sdk/client-location';
import {
  GeoPlacesClient,
  SuggestCommand,
  SearchTextCommand,
  GeocodeCommand,
} from '@aws-sdk/client-geo-places';

// Load AWS creds from the dispatch-api .env
dotenvConfig({ path: '../../../hussle-app-dispatch-api/.env' });

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const PLACE_INDEX_NAME = process.env.AWS_LOCATION_PLACE_INDEX_NAME;

if (!ACCESS_KEY || !SECRET_KEY || !PLACE_INDEX_NAME) {
  console.error('Missing AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_LOCATION_PLACE_INDEX_NAME');
  process.exit(1);
}

const credentials = { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY };

const v1 = new LocationClient({ region: REGION, credentials });
const v2 = new GeoPlacesClient({ region: REGION, credentials });

interface NormalizedResult {
  source: 'v1.SearchText' | 'v2.Suggest' | 'v2.SearchText' | 'v2.Geocode';
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  matchScore: number | null;
  placeType: string | null;
  raw?: unknown;
}

const safeNum = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

// --- v1.SearchPlaceIndexForText ---------------------------------------------
async function v1SearchText(query: string, max = 5): Promise<NormalizedResult[]> {
  const res = await v1.send(
    new SearchPlaceIndexForTextCommand({
      IndexName: PLACE_INDEX_NAME,
      Text: query,
      FilterCountries: ['USA'],
      MaxResults: max,
    }),
  );
  return (res.Results ?? []).map((r) => {
    const p = r.Place;
    const point = p?.Geometry?.Point;
    const addrParts = [p?.AddressNumber, p?.Street].filter(Boolean) as string[];
    const label = p?.Label ?? '';
    const firstSeg = label.split(',')[0]?.trim() ?? '';
    const addressLine = addrParts.join(' ') || null;
    const isPoi =
      firstSeg.length > 0 &&
      firstSeg !== p?.AddressNumber &&
      firstSeg !== p?.Street &&
      firstSeg !== addressLine &&
      firstSeg !== p?.Municipality &&
      firstSeg !== p?.Region &&
      firstSeg !== p?.PostalCode;
    return {
      source: 'v1.SearchText',
      title: isPoi ? firstSeg : null,
      address: addressLine,
      city: p?.Municipality ?? null,
      state: p?.Region ?? null,
      zip: p?.PostalCode ?? null,
      lat: safeNum(point?.[1]),
      lng: safeNum(point?.[0]),
      matchScore: null,
      placeType: null,
    };
  });
}

// --- v2.Suggest (typeahead, POI-aware) --------------------------------------
async function v2Suggest(query: string, max = 5): Promise<NormalizedResult[]> {
  const res = await v2.send(
    new SuggestCommand({
      QueryText: query,
      MaxResults: max,
      Filter: { IncludeCountries: ['USA'] },
      BiasPosition: [-98.5, 39.5], // US center — required for typeahead ops
    }),
  );
  return (res.ResultItems ?? []).map((item) => {
    const place = item.Place;
    const addr = place?.Address;
    const point = place?.Position;
    return {
      source: 'v2.Suggest',
      title: place?.Title ?? item.Title ?? null,
      address: addr?.Street ?? addr?.AddressNumber ?? null,
      city: addr?.Locality ?? null,
      state: addr?.Region?.Code ?? addr?.Region?.Name ?? null,
      zip: addr?.PostalCode ?? null,
      lat: safeNum(point?.[1]),
      lng: safeNum(point?.[0]),
      matchScore: null,
      placeType: place?.PlaceType ?? null,
      raw: item,
    };
  });
}

// --- v2.SearchText (free-form, structured response) -------------------------
async function v2SearchText(query: string, max = 5): Promise<NormalizedResult[]> {
  const res = await v2.send(
    new SearchTextCommand({
      QueryText: query,
      MaxResults: max,
      Filter: { IncludeCountries: ['USA'] },
      BiasPosition: [-98.5, 39.5], // US center — required when Filter is provided
    }),
  );
  return (res.ResultItems ?? []).map((item) => {
    const addr = item.Address;
    const point = item.Position;
    return {
      source: 'v2.SearchText',
      title: item.Title ?? null,
      address: addr?.Street ?? addr?.AddressNumber ?? null,
      city: addr?.Locality ?? null,
      state: addr?.Region?.Code ?? addr?.Region?.Name ?? null,
      zip: addr?.PostalCode ?? null,
      lat: safeNum(point?.[1]),
      lng: safeNum(point?.[0]),
      matchScore: null,
      placeType: item.PlaceType ?? null,
    };
  });
}

// --- v2.Geocode (deterministic geocoding for storage) -----------------------
async function v2Geocode(query: string, max = 3): Promise<NormalizedResult[]> {
  const res = await v2.send(
    new GeocodeCommand({
      QueryText: query,
      MaxResults: max,
      Filter: { IncludeCountries: ['USA'] },
      IntendedUse: 'Storage',
      AdditionalFeatures: ['SecondaryAddresses'],
    }),
  );
  return (res.ResultItems ?? []).map((item) => {
    const addr = item.Address;
    const point = item.Position;
    return {
      source: 'v2.Geocode',
      title: item.Title ?? null,
      address: addr?.Street ?? addr?.AddressNumber ?? null,
      city: addr?.Locality ?? null,
      state: addr?.Region?.Code ?? addr?.Region?.Name ?? null,
      zip: addr?.PostalCode ?? null,
      lat: safeNum(point?.[1]),
      lng: safeNum(point?.[0]),
      matchScore: safeNum(item.MatchScores?.Overall),
      placeType: item.PlaceType ?? null,
    };
  });
}

// --- runner -----------------------------------------------------------------
const QUERIES: { label: string; query: string; kind: 'POI' | 'STREET' | 'PARTIAL' | 'AMBIGUOUS' }[] = [
  { label: 'POI / brand search', query: 'walmart valley stream', kind: 'POI' },
  { label: 'POI / brand search', query: 'fedex office boston', kind: 'POI' },
  { label: 'POI / brand search', query: 'starbucks downtown chicago', kind: 'POI' },
  { label: 'POI w/ street hint', query: 'walmart 825 W Merrick Rd Valley Stream NY', kind: 'POI' },
  { label: 'Precise street address', query: '77 Green Acres Rd, Valley Stream, NY 11581', kind: 'STREET' },
  { label: 'Precise street address', query: '1 Microsoft Way, Redmond, WA 98052', kind: 'STREET' },
  { label: 'Precise street address', query: '1600 Amphitheatre Parkway, Mountain View, CA 94043', kind: 'STREET' },
  { label: 'Suite/multi-tenant',  query: '100 Federal St Ste 400, Boston, MA 02110', kind: 'STREET' },
  { label: 'Partial (city only)',  query: 'Valley Stream NY', kind: 'PARTIAL' },
  { label: 'Ambiguous',            query: '100 Main Street', kind: 'AMBIGUOUS' },
  { label: 'Garbage',              query: 'asdfasdf qweqwe', kind: 'AMBIGUOUS' },
];

const fmt = (r: NormalizedResult): string => {
  const parts = [
    r.title ? `title="${r.title}"` : 'title=null',
    r.address ? `addr="${r.address}"` : 'addr=null',
    r.city ? `city="${r.city}"` : 'city=null',
    r.state ? `st="${r.state}"` : 'st=null',
    r.zip ? `zip="${r.zip}"` : 'zip=null',
    r.matchScore !== null ? `score=${r.matchScore}` : null,
    r.placeType ? `type=${r.placeType}` : null,
  ].filter(Boolean);
  return parts.join(' | ');
};

async function runOne(label: string, query: string, kind: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${kind}] ${label}: "${query}"`);
  console.log('='.repeat(80));

  for (const [name, fn] of [
    ['v1.SearchText', () => v1SearchText(query)],
    ['v2.Suggest    ', () => v2Suggest(query)],
    ['v2.SearchText ', () => v2SearchText(query)],
    ['v2.Geocode    ', () => v2Geocode(query)],
  ] as const) {
    try {
      const results = await fn();
      console.log(`\n  ${name}  (${results.length} result${results.length === 1 ? '' : 's'})`);
      if (results.length === 0) {
        console.log('    (no results)');
      } else {
        results.slice(0, 3).forEach((r, i) => {
          console.log(`    [${i}] ${fmt(r)}`);
        });
      }
    } catch (e) {
      console.log(`\n  ${name}  ERROR: ${(e as Error).message}`);
    }
  }
}

async function main() {
  console.log(`AWS Region: ${REGION}`);
  console.log(`v1 PlaceIndex: ${PLACE_INDEX_NAME}`);
  console.log(`Comparing v1 SearchPlaceIndexForText vs v2 Suggest/SearchText/Geocode`);

  for (const q of QUERIES) {
    await runOne(q.label, q.query, q.kind);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
