/**
 * The Relay path is a thin pass-through. We test the PUSH_RELAY_LOADS handler
 * registered on chrome.runtime.onMessage in background.ts.
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

describe('PUSH_RELAY_LOADS handler', () => {
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

  it('unwraps workOpportunities and pushes to API as relay source', async () => {
    await chrome.storage.local.set({ apiKey: 'fc_live_test' });
    fetchMock.mockResolvedValue(makeResponse(200, { data: { ingested: 2 } }));

    const sendResponse = jest.fn();
    const ret = listener(
      {
        type: 'PUSH_RELAY_LOADS',
        data: { workOpportunities: [{ id: 'r1' }, { id: 'r2' }] },
      },
      {},
      sendResponse,
    );

    expect(ret).toBe(true); // async response

    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(
      JSON.stringify({ source: 'relay', loads: [{ id: 'r1' }, { id: 'r2' }] }),
    );
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, count: 2 });
  });

  it('rejects with error when workOpportunities is missing', () => {
    const sendResponse = jest.fn();
    const ret = listener({ type: 'PUSH_RELAY_LOADS', data: {} }, {}, sendResponse);

    expect(ret).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      error: 'No workOpportunities in data',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
