// MV3 service worker — bundled by webpack from this TS source.

import { getApiKey, clearApiKey } from '../popup/apiKeyStorage';

declare const process: { env: { API_URL: string } };

const API_URL = process.env.API_URL;
const INGEST_PATH = '/api/v1/load-board/ingest';

type LoadSource = 'relay' | 'dat';

type RelayMessageData = { workOpportunities?: unknown };

type BackgroundMessage =
  | { type: 'popupInit' }
  | { type: 'RELAY_LOAD_COUNT'; count: number }
  | { type: 'PUSH_RELAY_LOADS'; data: RelayMessageData }
  | { type: 'PUSH_DAT_LOADS'; loads: unknown[] }
  | { type: 'RETRY_LAST_PAYLOAD' };

interface PushResult {
  ok: boolean;
  error?: string;
  count?: number;
}

interface FailedPayload {
  source: LoadSource;
  loads: unknown[];
  timestamp: number;
}

interface LastError {
  message: string;
  timestamp: number;
}

const DEFAULT_PUSH_INTERVAL_SECONDS = 10;
const FAILURE_BADGE_COLOR = '#D32F2F';

const lastPushTimes: Record<LoadSource, number> = { relay: 0, dat: 0 };

const isMessage = (value: unknown): value is BackgroundMessage =>
  typeof value === 'object' && value !== null && 'type' in value;

console.log('[Hustle:background] Service worker started');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Hustle:background] Extension installed');
});

const recordFailure = async (
  source: LoadSource,
  loads: unknown[],
  message: string,
): Promise<void> => {
  const stored = await chrome.storage.local.get(['failedCount']);
  const previous = typeof stored.failedCount === 'number' ? stored.failedCount : 0;
  const failedCount = previous + 1;

  const failedPayload: FailedPayload = { source, loads, timestamp: Date.now() };
  const lastError: LastError = { message, timestamp: Date.now() };

  await chrome.storage.local.set({ failedCount, lastFailedPayload: failedPayload, lastError });

  chrome.action.setBadgeText({ text: String(failedCount) });
  chrome.action.setBadgeBackgroundColor({ color: FAILURE_BADGE_COLOR });
};

const clearFailureState = async (): Promise<void> => {
  await chrome.storage.local.remove(['failedCount', 'lastFailedPayload', 'lastError']);
  chrome.action.setBadgeText({ text: '' });
};

const pushLoadsToApi = async (source: LoadSource, loads: unknown[]): Promise<PushResult> => {
  if (!Array.isArray(loads) || loads.length === 0) {
    return { ok: false, error: 'No loads to push' };
  }

  const apiKey = await getApiKey();
  if (apiKey === null) {
    await chrome.storage.local.set({
      lastError: { message: 'Set API key in extension popup', timestamp: Date.now() },
    });
    return { ok: false, error: 'No API key' };
  }

  const stored = await chrome.storage.local.get(['pushIntervalSeconds']);
  const intervalSeconds =
    typeof stored.pushIntervalSeconds === 'number'
      ? stored.pushIntervalSeconds
      : DEFAULT_PUSH_INTERVAL_SECONDS;
  const intervalMs = intervalSeconds * 1000;
  const now = Date.now();

  if (now - lastPushTimes[source] < intervalMs) {
    return { ok: false, error: `Throttled (${source})` };
  }
  lastPushTimes[source] = now;

  console.log(`[Hustle:background] Pushing ${loads.length} ${source} loads to API`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${INGEST_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ source, loads }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    await recordFailure(source, loads, message);
    return { ok: false, error: message };
  }

  if (response.status === 401) {
    await clearApiKey();
    await chrome.storage.local.set({
      lastError: {
        message: 'API key invalid — paste a new one in the extension popup',
        timestamp: Date.now(),
      },
    });
    return { ok: false, error: 'Invalid API key' };
  }

  if (!response.ok) {
    let errText = '';
    try {
      errText = await response.text();
    } catch {
      // body unavailable — ignore
    }
    const message = `API returned ${response.status}${errText ? `: ${errText.slice(0, 200)}` : ''}`;
    console.error(`[Hustle:background] ${message}`);
    await recordFailure(source, loads, message);
    return { ok: false, error: message };
  }

  const result: { data?: { ingested?: number } } = await response.json();
  console.log('[Hustle:background] Push success:', result);

  await clearFailureState();

  chrome.action.setBadgeText({ text: String(loads.length) });
  chrome.action.setBadgeBackgroundColor({
    color: source === 'relay' ? '#2196F3' : '#FF9800',
  });

  return { ok: true, count: result.data?.ingested ?? loads.length };
};

const retryLastPayload = async (): Promise<PushResult> => {
  const stored = await chrome.storage.local.get(['lastFailedPayload']);
  const payload = stored.lastFailedPayload as FailedPayload | undefined;
  if (!payload || (payload.source !== 'relay' && payload.source !== 'dat')) {
    return { ok: false, error: 'No failed payload to retry' };
  }
  // Reset throttle so retry isn't suppressed.
  lastPushTimes[payload.source] = 0;
  return pushLoadsToApi(payload.source, payload.loads);
};

chrome.runtime.onMessage.addListener((rawMessage, _sender, sendResponse) => {
  if (!isMessage(rawMessage)) {
    sendResponse({ msg: 'unknown message type' });
    return false;
  }

  switch (rawMessage.type) {
    case 'popupInit':
      sendResponse({ message: 'ok' });
      return false;

    case 'RELAY_LOAD_COUNT': {
      const { count } = rawMessage;
      chrome.storage.local.set({ relayLoadCount: count, relayLastUpdated: Date.now() });
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
      sendResponse({ ok: true });
      return false;
    }

    case 'PUSH_RELAY_LOADS': {
      const workOpps = rawMessage.data?.workOpportunities;
      if (!Array.isArray(workOpps)) {
        sendResponse({ ok: false, error: 'No workOpportunities in data' });
        return false;
      }
      console.log(`[Hustle:background] PUSH_RELAY_LOADS — ${workOpps.length} loads`);
      pushLoadsToApi('relay', workOpps)
        .then((result) => sendResponse(result))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: message });
        });
      return true;
    }

    case 'PUSH_DAT_LOADS': {
      const loads = rawMessage.loads ?? [];
      console.log(`[Hustle:background] PUSH_DAT_LOADS — ${loads.length} loads`);
      pushLoadsToApi('dat', loads)
        .then((result) => sendResponse(result))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: message });
        });
      return true;
    }

    case 'RETRY_LAST_PAYLOAD': {
      retryLastPayload()
        .then((result) => sendResponse(result))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          sendResponse({ ok: false, error: message });
        });
      return true;
    }

    default: {
      const exhaustiveCheck: never = rawMessage;
      sendResponse({ msg: 'unknown message type', received: exhaustiveCheck });
      return false;
    }
  }
});

export { pushLoadsToApi, retryLastPayload };
