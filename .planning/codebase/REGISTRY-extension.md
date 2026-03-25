# Registry: extension

Package: `fleetcommand-extension` — Chrome extension for DAT load board scraping.
Built with esbuild, tested with Jest + jsdom.

## 1. Inventory

### Content Scripts

| Name | Path | Exports | Purpose |
|------|------|---------|---------|
| `dat-scraper` | `content/dat-scraper.ts` | `scrapeSearchResults`, `sendLoadData`, `getScraperStatus`, `resumeScraping` | Scrapes load rows from DAT search results via selector fallback chains; auto-observes DOM mutations |
| `dat-market` | `content/dat-market.ts` | `extractMarketData`, `extractMarketRate`, `hasMarketData`, `hasMarketRateData`, `logMarketError` | Scrapes load-to-truck ratios and lane rate data from DAT sidebar |
| `dat-detector` | `content/dat-detector.ts` | `detectPageType`, `isDatPage` | Identifies DAT page type (`search-results` / `load-detail` / `unknown`) via URL patterns + DOM markers |

### Background

| Name | Path | Purpose |
|------|------|---------|
| `service-worker` | `background/service-worker.ts` | Message hub: queues scraped loads, deduplicates, auto-flushes batches to API, tracks DAT tabs, manages capture mode |

### Popup

| Name | Path | Purpose |
|------|------|---------|
| `popup` | `popup/popup.ts` | Minimal UI: shows connection status and scraped-loads count |

### Shared Modules

| Name | Path | Key Exports | Purpose |
|------|------|-------------|---------|
| `types` | `shared/types.ts` | `LoadIntelPayload`, `BatchResult`, `IngestResult`, `MarketData`, `MarketLane`, `StorageSchema`, `ConnectionStatus` | Canonical type definitions |
| `normalizer` | `shared/normalizer.ts` | `normalizeScrapedLoad`, `normalizeScrapedLoads`, `ScrapedLoad`, `ScrapedBroker` | Transforms raw scraped data into `LoadIntelPayload` (title-case cities, parsed rates/miles, flattened broker) |
| `api` | `shared/api.ts` | `ingestSingle`, `ingestBatch`, `storeMarketData`, `checkConnectionStatus`, `saveApiToken`, `getApiToken` | Authenticated fetch client for FleetCommand API |
| `dedup` | `shared/dedup.ts` | `filterDuplicates`, `checkAndCache`, `generateHash`, `clearCache`, `getCacheSize` | Session-scoped SHA-256 dedup cache |
| `apiErrors` | `shared/apiErrors.ts` | `FleetCommandApiError`, `AuthenticationError`, `NetworkError`, `ConfigurationError`, `ApiResponseError` | Typed error hierarchy for API failures |

## 2. Key Types

```typescript
type CaptureMode = 'idle' | 'active-page' | 'auto-capture';
type DatPageType = 'search-results' | 'load-detail' | 'unknown';
type LoadSource = 'dat' | 'dat_bulk';

interface LoadIntelPayload {
  externalId: string; origin: NormalizedLocation; destination: NormalizedLocation;
  pickupDate: string; deliveryDate: string; equipmentType: string;
  weight: number | null; distance: number | null; rate: number | null;
  brokerName: string | null; brokerMc: string | null; source: LoadSource; scrapedAt: number;
}

interface ScrapedLoad {
  externalId: string; origin: string; destination: string;
  originLocation: ScrapedLocation; destinationLocation: ScrapedLocation;
  pickupDate: string; deliveryDate: string; equipmentType: string;
  weight: number | null; distance: number | null; rate: number | null;
  broker: ScrapedBroker | null; source: 'dat'; scrapedAt: number;
}

type ConnectionStatus =
  | { state: 'connected' }
  | { state: 'disconnected'; reason: string }
  | { state: 'unconfigured' };
```

## 3. Representative Patterns

**Selector fallback chains** — resilient to DAT layout changes:

```typescript
const ORIGIN_SELECTORS: SelectorChain = {
  field: 'origin',
  selectors: [
    '[data-testid="origin-location"]',
    '.origin-city',
    'td.origin',
    '[class*="origin"]',
    'td:nth-child(1)',
  ],
};

const resolveChain = (parent: Element, chain: SelectorChain): SelectorChainResult => {
  const matchingSelector = chain.selectors.find(
    (selector) => parent.querySelector(selector) !== null,
  );
  // returns first match or { failed: true }
};
```

**Service worker message dispatch** — discriminated union pattern:

```typescript
type ServiceWorkerMessage =
  | { type: 'LOADS_SCRAPED'; payload: ReadonlyArray<ScrapedLoad> }
  | { type: 'SET_MODE'; mode: CaptureMode }
  | { type: 'FLUSH_QUEUE' }
  // ...

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'LOADS_SCRAPED': {
      enqueue(message.payload).then(() => sendResponse({ queued: true }));
      return true; // async response
    }
    // ...
  }
});
```
