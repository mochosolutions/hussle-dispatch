// Vite reads import.meta.env at build time (not runtime). Changing these for
// local dev or tests therefore requires restarting the dev server. The
// Playwright config injects overrides via `webServer.env`.

const DEFAULT_LEAD_MS = 5 * 60 * 1000;
const DEFAULT_BACKOFF_MS: readonly number[] = [500, 1500, 4000];

const parseBackoff = (raw: string | undefined): readonly number[] => {
  if (!raw) {
    return DEFAULT_BACKOFF_MS;
  }
  const parsed = raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return parsed.length > 0 ? parsed : DEFAULT_BACKOFF_MS;
};

export const PROACTIVE_REFRESH_LEAD_MS: number =
  Number(import.meta.env.VITE_PROACTIVE_REFRESH_LEAD_MS) || DEFAULT_LEAD_MS;

export const TRANSIENT_RETRY_BACKOFF_MS: readonly number[] = parseBackoff(
  import.meta.env.VITE_TRANSIENT_RETRY_BACKOFF_MS as string | undefined,
);
