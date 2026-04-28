// Polyfill setImmediate for jsdom (browser env strips it).
if (typeof (globalThis as { setImmediate?: unknown }).setImmediate === 'undefined') {
  (globalThis as unknown as { setImmediate: (fn: () => void) => void }).setImmediate = (
    fn: () => void,
  ) => {
    setTimeout(fn, 0);
  };
}

type StorageRecord = Record<string, unknown>;

interface StorageChange {
  newValue?: unknown;
  oldValue?: unknown;
}

interface ChangeListener {
  (changes: Record<string, StorageChange>, area: 'local'): void;
}

const storage: StorageRecord = {};
const onChangedListeners: ChangeListener[] = [];

const setMany = async (entries: StorageRecord): Promise<void> => {
  const changes: Record<string, StorageChange> = {};
  Object.entries(entries).forEach(([key, value]) => {
    changes[key] = { oldValue: storage[key], newValue: value };
    storage[key] = value;
  });
  onChangedListeners.forEach((l) => l(changes, 'local'));
};

const removeMany = async (keys: string | string[]): Promise<void> => {
  const list = Array.isArray(keys) ? keys : [keys];
  const changes: Record<string, StorageChange> = {};
  list.forEach((k) => {
    changes[k] = { oldValue: storage[k], newValue: undefined };
    delete storage[k];
  });
  onChangedListeners.forEach((l) => l(changes, 'local'));
};

const getMany = async (keys: string | string[] | null): Promise<StorageRecord> => {
  if (keys === null || keys === undefined) {
    return { ...storage };
  }
  const list = Array.isArray(keys) ? keys : [keys];
  const out: StorageRecord = {};
  list.forEach((k) => {
    if (k in storage) out[k] = storage[k];
  });
  return out;
};

(globalThis as unknown as { chrome: unknown }).chrome = {
  storage: {
    local: {
      get: jest.fn((keys: string | string[] | null) => getMany(keys)),
      set: jest.fn((entries: StorageRecord) => setMany(entries)),
      remove: jest.fn((keys: string | string[]) => removeMany(keys)),
    },
    onChanged: {
      addListener: jest.fn((l: ChangeListener) => onChangedListeners.push(l)),
      removeListener: jest.fn((l: ChangeListener) => {
        const idx = onChangedListeners.indexOf(l);
        if (idx >= 0) onChangedListeners.splice(idx, 1);
      }),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  runtime: {
    onInstalled: { addListener: jest.fn() },
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    sendMessage: jest.fn(),
    lastError: undefined,
  },
};

(globalThis as unknown as { __resetChromeMock?: () => void }).__resetChromeMock = () => {
  Object.keys(storage).forEach((k) => delete storage[k]);
  onChangedListeners.length = 0;
};
