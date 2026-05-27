/**
 * Tests for pushLoadsToApi in background.ts.
 *
 * The throttle map (`lastPushTimes`) is module-scoped, so we use
 * jest.resetModules() + dynamic require in beforeEach so each test starts fresh.
 */

interface PushResult {
  ok: boolean;
  error?: string;
  count?: number;
}

interface PushLoadsToApi {
  (source: 'relay' | 'dat', loads: unknown[]): Promise<PushResult>;
}

type FetchMock = jest.Mock;

const resetChromeMock = (): void => {
  const fn = (globalThis as unknown as { __resetChromeMock?: () => void }).__resetChromeMock;
  if (fn) fn();
};

const loadModule = (): { pushLoadsToApi: PushLoadsToApi } => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../contentScript/background');
};

interface FakeResponse {
  status: number;
  ok: boolean;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

const makeResponse = (status: number, body: unknown): FakeResponse => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

describe('pushLoadsToApi', () => {
  let pushLoadsToApi: PushLoadsToApi;
  let fetchMock: FetchMock;

  beforeEach(() => {
    jest.resetModules();
    resetChromeMock();
    jest.clearAllMocks();
    fetchMock = jest.fn() as FetchMock;
    (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
    ({ pushLoadsToApi } = loadModule());
  });

  it('returns error and writes lastError when no API key is stored', async () => {
    const result = await pushLoadsToApi('dat', [{ id: 1 }]);

    expect(result).toEqual({ ok: false, error: 'No API key' });
    const stored = await chrome.storage.local.get(['lastError']);
    expect(stored.lastError).toBeDefined();
    expect((stored.lastError as { message: string }).message).toContain('Set API key');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends Authorization Bearer header when key is stored', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_xyz' });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 1 } }));

    await pushLoadsToApi('dat', [{ id: 1 }]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[1].headers).toMatchObject({ Authorization: 'Bearer fc_live_xyz' });
  });

  it('returns ok with count on 200 response', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_xyz' });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 3 } }));

    const result = await pushLoadsToApi('dat', [{ a: 1 }, { a: 2 }, { a: 3 }]);

    expect(result).toEqual({ ok: true, count: 3 });
  });

  it('clears apiKey and writes lastError on 401, returns Invalid API key', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_bad' });
    fetchMock.mockResolvedValue(makeResponse(401, { error: 'unauthorized' }));

    const result = await pushLoadsToApi('relay', [{ id: 'r1' }]);

    expect(result).toEqual({ ok: false, error: 'Invalid API key' });

    const stored = await chrome.storage.local.get(['apiKey', 'lastError', 'failedCount']);
    expect(stored.apiKey).toBeUndefined();
    expect((stored.lastError as { message: string }).message).toContain('API key invalid');
    // Auth failures are distinct from transient failures.
    expect(stored.failedCount).toBeUndefined();
  });

  it('records failure on 500 status', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_xyz' });
    fetchMock.mockResolvedValue(makeResponse(500, 'boom'));

    const result = await pushLoadsToApi('dat', [{ id: 1 }]);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('API returned 500');

    const stored = await chrome.storage.local.get([
      'failedCount',
      'lastFailedPayload',
      'lastError',
    ]);
    expect(stored.failedCount).toBe(1);
    expect(stored.lastFailedPayload).toMatchObject({ source: 'dat', loads: [{ id: 1 }] });
    expect((stored.lastError as { message: string }).message).toContain('API returned 500');
  });

  it('records failure when fetch throws a network error', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_xyz' });
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await pushLoadsToApi('dat', [{ id: 1 }]);

    expect(result).toEqual({ ok: false, error: 'network down' });

    const stored = await chrome.storage.local.get([
      'failedCount',
      'lastFailedPayload',
      'lastError',
    ]);
    expect(stored.failedCount).toBe(1);
    expect(stored.lastFailedPayload).toMatchObject({ source: 'dat' });
    expect((stored.lastError as { message: string }).message).toBe('network down');
  });

  it('throttles consecutive calls within pushIntervalSeconds window', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_xyz', pushIntervalSeconds: 60 });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 1 } }));

    const first = await pushLoadsToApi('relay', [{ id: 1 }]);
    expect(first).toEqual({ ok: true, count: 1 });

    const second = await pushLoadsToApi('relay', [{ id: 2 }]);
    expect(second).toEqual({ ok: false, error: 'Throttled (relay)' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('clears failure state on success', async () => {
    await chrome.storage.local.set({
      apiKey: 'fc_live_xyz',
      failedCount: 5,
      lastFailedPayload: { source: 'dat', loads: [{ id: 'old' }], timestamp: 1 },
      lastError: { message: 'old error', timestamp: 1 },
    });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 1 } }));

    const result = await pushLoadsToApi('dat', [{ id: 1 }]);

    expect(result.ok).toBe(true);
    const stored = await chrome.storage.local.get([
      'failedCount',
      'lastFailedPayload',
      'lastError',
    ]);
    expect(stored.failedCount).toBeUndefined();
    expect(stored.lastFailedPayload).toBeUndefined();
    expect(stored.lastError).toBeUndefined();
  });
});
