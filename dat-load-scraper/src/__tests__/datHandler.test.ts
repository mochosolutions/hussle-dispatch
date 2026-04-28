/**
 * Tests the PUSH_DAT_LOADS handler in background.ts end-to-end.
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

describe('PUSH_DAT_LOADS handler', () => {
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

  it('forwards combined DAT loads to API as dat source', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_test' });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 2 } }));

    const matchDetails = [{ matchId: 'M1' }];
    const similarMatchDetails = [{ matchId: 'S1' }];
    const loads = [...matchDetails, ...similarMatchDetails];

    const sendResponse = jest.fn();
    const ret = listener({ type: 'PUSH_DAT_LOADS', loads }, {}, sendResponse);

    expect(ret).toBe(true);

    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const parsed = JSON.parse(init.body as string) as {
      source: string;
      loads: unknown[];
    };
    expect(parsed.source).toBe('dat');
    expect(parsed.loads).toHaveLength(2);
    expect(parsed.loads).toEqual([{ matchId: 'M1' }, { matchId: 'S1' }]);
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, count: 2 });
  });

  it('returns error and does not call fetch when loads is empty', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_test' });

    const sendResponse = jest.fn();
    const ret = listener({ type: 'PUSH_DAT_LOADS', loads: [] }, {}, sendResponse);

    expect(ret).toBe(true);

    await flushPromises();
    await flushPromises();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ ok: false, error: 'No loads to push' });
  });
});
