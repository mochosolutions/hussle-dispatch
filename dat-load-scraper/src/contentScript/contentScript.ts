import { store, saveDatLoadsToStore } from '../redux';
import { siteHandlers } from '../sites';

function waitForElm(selector: string) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)?.firstElementChild) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)?.firstElementChild) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

const injectScript = (filePath: string) => {
  const srcFile = chrome.runtime.getURL(filePath);
  console.log('srcFile', srcFile);
  const s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.src = srcFile;
  (document.head || document.documentElement).appendChild(s);
};

const addCustomStyles = (css: string) => {
  const newStyles = document.createElement('style');
  newStyles.innerHTML = css;
  document.head.appendChild(newStyles);
};

// Guard: check if extension context is still valid (survives extension reload)
const isContextValid = (): boolean => {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
};

// Build a lookup of action types that should write to chrome.storage
// Each handler defines its own storageUpdate shape in parse()
const actionTypes = new Set(
  siteHandlers.map((h) => {
    // Convention: actionType is STORE_<NAME>_LOADS
    // We collect all possible action types from handlers
    return `STORE_${h.name.toUpperCase()}_LOADS`;
  }),
);

// API push is handled by the background service worker (cross-origin fetch).
// Content script sends a message; background does the actual POST.
const requestRelayPush = (responseData: unknown): void => {
  chrome.runtime.sendMessage(
    { type: 'PUSH_RELAY_LOADS', data: responseData },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Hustle] Push message failed:', chrome.runtime.lastError.message);
        return;
      }
      console.log('[Hustle] Background push result:', response);
    },
  );
};

// Inject script IMMEDIATELY at document_start — before page scripts load
injectScript('script.js');

// Listen for messages from the injected script
console.log('[Hustle:contentScript] Loaded. actionTypes:', [...actionTypes]);

window.addEventListener('message', (event) => {
  if (!isContextValid()) {
    console.warn('[Hustle:contentScript] Context invalidated, ignoring message');
    return;
  }
  const { type, payload } = event.data;
  if (!type) return;

  // Only log Hustle-related messages (skip React DevTools, etc.)
  if (type === 'STORE_DAT_LOADS' || type === 'STORE_RELAY_LOADS' || actionTypes.has(type)) {
    console.log(`[Hustle:contentScript] Received message type=${type}`);
  }

  // DAT — legacy handler with custom redux flow + API push
  if (type === 'STORE_DAT_LOADS') {
    const { data } = payload;
    store.dispatch(saveDatLoadsToStore(data));

    // Push DAT loads to API via background service worker
    const combinedLoads = [
      ...((data as Record<string, unknown>)?.matchDetails as unknown[] ?? []),
      ...((data as Record<string, unknown>)?.similarMatchDetails as unknown[] ?? []),
    ];
    if (combinedLoads.length > 0) {
      console.log(`[Hustle:contentScript] Pushing ${combinedLoads.length} DAT loads to API`);
      chrome.runtime.sendMessage(
        { type: 'PUSH_DAT_LOADS', loads: combinedLoads },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Hustle:contentScript] DAT push failed:', chrome.runtime.lastError.message);
            return;
          }
          console.log('[Hustle:contentScript] DAT push result:', response);
        },
      );
    }
    return;
  }

  // Generic handler for all site-handler-driven actions
  if (actionTypes.has(type)) {
    store.dispatch(event.data);

    // Check if there's a storageUpdate attached
    const storageUpdate = payload?.storageUpdate;
    if (storageUpdate) {
      console.log('[Hustle:contentScript] Writing to storage:', storageUpdate);
      chrome.storage.local.set(storageUpdate);
    }

    // Push Relay loads to the dispatch API via background service worker
    if (type === 'STORE_RELAY_LOADS') {
      console.log('[Hustle:contentScript] Sending PUSH_RELAY_LOADS to background. payload.data keys:', payload?.data ? Object.keys(payload.data as Record<string, unknown>) : 'null');
      requestRelayPush(payload.data);
    }
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse): void {
  if (!isContextValid()) return;
  console.group('Filtering Message from Extension');
  console.log(sender.tab ? `from a content script:${sender.tab.url}` : 'from the extension');
  console.log('message', message);
  console.groupEnd();
  const messagePayload = message?.payload;
  store.dispatch({ type: 'UPDATED_LOAD_FILTERS', payload: messagePayload });
});

// DOM-dependent setup — wait for DOMContentLoaded before injecting styles
(async () => {
  if (document.readyState === 'loading') {
    await new Promise<void>((resolve) => {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
  }

  addCustomStyles(`
  .lower-cell.rate-cell.ng-star-inserted {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: 400;
  }
  `);

  const searchContainer = await waitForElm('.cdk-virtual-scroll-content-wrapper');

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const mutationItems = [...mutation.addedNodes];
        const childItem = mutationItems[0] as Element;
        const loadId = childItem?.classList[0];
        store.dispatch({ type: 'TEST', payload: { loadId } });
      }
    });
  });

  observer.observe(searchContainer as Node, {
    childList: true,
  });
})();
