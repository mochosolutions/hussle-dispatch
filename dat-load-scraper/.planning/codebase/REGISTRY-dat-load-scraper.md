# Registry: dat-load-scraper

> Chrome Extension (Manifest V3) that scrapes DAT freight load board, deduplicates loads, and calculates minimum acceptable rates.

## Entry Points

| File | Role | Description |
|------|------|-------------|
| src/contentScript/contentScript.ts | Content Script | Injected into pages; intercepts DOM mutations, dispatches Redux actions, listens for popup messages |
| src/contentScript/script.ts | Injected Script | Intercepts XHR to DAT API (`freight.api.prod.dat.com`), parses load data, posts to content script via `window.postMessage` |
| src/contentScript/background.ts | Service Worker | Chrome extension background script; handles `onInstalled` and message routing |
| src/popup/index.tsx | Popup UI | React popup with Formik form for configuring rate/dispatch fee filters |
| src/static/manifest.json | Manifest | Chrome Extension Manifest V3 config |

## State Management

| File | Role | Description |
|------|------|-------------|
| src/redux/index.ts | Redux Store | Configures store with `loadsReducer` and `loadsFilterReducer`; runs Redux Saga middleware |

### Redux Actions
| Action | Triggered By | Saga Handler |
|--------|-------------|--------------|
| `STORE_DAT_LOADS` | XHR intercept (script.ts) | `fetchUser` — deduplicates loads, removes duplicate DOM elements, calculates min rates |
| `TEST` | DOM mutation observer (contentScript.ts) | `handleFiltering` — calculates min rate for individual load card |
| `UPDATED_LOAD_FILTERS` | Popup form submit | `handleFilteringChange` — reapplies rate calculations with new filter values |
| `SAVE_FILTER_IDS` | Internal (saga) | Stores duplicate load IDs |
| `APPLY_LOAD_FILTER` | Internal (saga) | Updates filter state (dispatchFee, ratePerMile) |

### State Shape
| Slice | Key Fields |
|-------|------------|
| `loads` | `data: []` (load objects), `filteredLoadsId: []` (duplicate IDs) |
| `loadFilters` | `dispatchFee: 0.5`, `ratePerMile: 2` |

## Utilities

| File | Exports | Description |
|------|---------|-------------|
| src/utils/removeDuplicates.ts | `combinedExactAndSimilarLoadData`, `findDuplicates`, `findDuplicatesId`, `calculateMiniumAcceptableOffer`, `calculateLoadsMiniumAcceptableOffer`, `createLoadMap`, `createMiniumRateEle` | Core business logic: merges exact/similar matches, detects duplicate loads by composite key, calculates minimum acceptable rates |
| src/utils/formatters/index.js | `numberFormatterFactory`, `currencyFormatter` | Intl.NumberFormat wrapper; `currencyFormatter` formats USD with no decimals |
| src/utils/s3.ts | `s3PutObject`, `s3GetObject`, `SqsProducer`, `run` | AWS S3/SQS integration for persisting load data (contains hardcoded credentials) |
| src/constants/equipmentType.ts | `equipmentType` | Equipment type lookup table (AC, BT, V, R, etc.) |

## External Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| DAT Freight API | `freight.api.prod.dat.com/trucker-api-web/api/v2/freightMatching/search` — intercepted via XHR monkey-patch |
| AWS S3 | `dat-load` bucket — stores load data JSON |
| AWS SQS | `hustle-dat-queue.fifo` — FIFO queue for load data pipeline |

## Build

| Tool | Config |
|------|--------|
| Webpack | `webpack.common.js`, `webpack.dev.js` (dev), `webpack.prod.js` (prod) |
| TypeScript | `tsconfig.json` — target ES6, JSX React, ES module |

## Dependencies (Key)

| Package | Purpose |
|---------|---------|
| react, react-dom | Popup UI |
| @reduxjs/toolkit, redux-saga, redux-logger | State management |
| cheerio | HTML parsing (imported but usage unclear) |
| lodash | `get` for safe property access |
| @aws-sdk/client-s3, @aws-sdk/client-sqs | AWS data persistence |
| ioredis | Redis client (imported in package.json, no usage found in src) |
| formik, yup | Form handling and validation |
