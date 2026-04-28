/**
 * Tests that the chrome.runtime.onMessage listener routes correctly per type
 * and returns the right async/sync flag.
 */

interface SendResponse {
  (response: unknown): void;
}

interface MessageListener {
  (message: unknown, sender: unknown, sendResponse: SendResponse): boolean | void;
}

type FetchMock = jest.Mock;

const resetChromeMock = (): void => {
  const fn = (globalThis as unknown as { __resetChromeMock?: () => void }).__resetChromeMock;
  if (fn) fn();
};

const flushPromises = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const captureListener = (): MessageListener => {
  const addListenerMock = chrome.runtime.onMessage.addListener as unknown as jest.Mock;
  const calls = addListenerMock.mock.calls;
  const last = calls[calls.length - 1];
  return last[0] as MessageListener;
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

describe('message routing', () => {
  let listener: MessageListener;
  let fetchMock: FetchMock;

  beforeEach(() => {
    jest.resetModules();
    resetChromeMock();
    jest.clearAllMocks();
    fetchMock = jest.fn() as FetchMock;
    (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../contentScript/background');
    listener = captureListener();
  });

  it('responds ok and returns false for popupInit', () => {
    const sendResponse = jest.fn();
    const ret = listener({ type: 'popupInit' }, {}, sendResponse);

    expect(ret).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({ message: 'ok' });
  });

  it('writes relay count + sets blue badge for RELAY_LOAD_COUNT', async () => {
    const sendResponse = jest.fn();
    const ret = listener(
      { type: 'RELAY_LOAD_COUNT', count: 5 },
      {},
      sendResponse,
    );

    expect(ret).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });

    // chrome.storage.local.set is fire-and-forget here, but our shim is sync;
    // give the microtask queue a tick just in case.
    await flushPromises();

    const stored = await chrome.storage.local.get([
      'relayLoadCount',
      'relayLastUpdated',
    ]);
    expect(stored.relayLoadCount).toBe(5);
    expect(typeof stored.relayLastUpdated).toBe('number');

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '5' });
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: '#2196F3',
    });
  });

  it('returns true (async) for PUSH_RELAY_LOADS with valid payload', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_xyz' });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 1 } }));

    const sendResponse = jest.fn();
    const ret = listener(
      {
        type: 'PUSH_RELAY_LOADS',
        data: { workOpportunities: [{ id: 'r1' }] },
      },
      {},
      sendResponse,
    );

    expect(ret).toBe(true);
    await flushPromises();
    await flushPromises();
    expect(sendResponse).toHaveBeenCalled();
  });

  it('returns true (async) for PUSH_DAT_LOADS', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_xyz' });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 1 } }));

    const sendResponse = jest.fn();
    const ret = listener(
      { type: 'PUSH_DAT_LOADS', loads: [{ matchId: 'a' }] },
      {},
      sendResponse,
    );

    expect(ret).toBe(true);
    await flushPromises();
    await flushPromises();
    expect(sendResponse).toHaveBeenCalled();
  });

  it('returns true (async) for RETRY_LAST_PAYLOAD and re-pushes the stored payload', async () => {
    await chrome.storage.local.set({
      apiKey: 'fc_live_xyz',
      lastFailedPayload: {
        source: 'dat',
        loads: [{ matchId: 'm1' }],
        timestamp: Date.now(),
      },
    });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 1 } }));

    const sendResponse = jest.fn();
    const ret = listener({ type: 'RETRY_LAST_PAYLOAD' }, {}, sendResponse);

    expect(ret).toBe(true);
    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, count: 1 });
  });

  it('responds with unknown message info for unrecognized type', () => {
    const sendResponse = jest.fn();
    // Cast to bypass discriminated-union typing — we're testing the runtime guard.
    const unknownMessage = { type: 'NOT_REAL' } as unknown as { type: 'popupInit' };
    const ret = listener(unknownMessage, {}, sendResponse);

    expect(ret).toBe(false);
    expect(sendResponse).toHaveBeenCalled();
    const arg = (sendResponse as jest.Mock).mock.calls[0][0] as { msg: string };
    expect(arg.msg).toBe('unknown message type');
  });
});
