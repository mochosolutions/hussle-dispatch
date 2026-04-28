// Storage helpers for the FleetCommand API key. Used by both the popup UI
// (to read/save/clear) and the background service worker (to read on each push).

const STORAGE_KEY = 'apiKey';

export const getApiKey = async (): Promise<string | null> => {
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  const value = result[STORAGE_KEY];
  return typeof value === 'string' && value.length > 0 ? value : null;
};

export const setApiKey = async (key: string): Promise<void> => {
  await chrome.storage.local.set({ [STORAGE_KEY]: key });
};

export const clearApiKey = async (): Promise<void> => {
  await chrome.storage.local.remove(STORAGE_KEY);
};

export const maskKey = (key: string): string => {
  if (key.length <= 4) return '••••';
  const last4 = key.slice(-4);
  return `••••••••${last4}`;
};
