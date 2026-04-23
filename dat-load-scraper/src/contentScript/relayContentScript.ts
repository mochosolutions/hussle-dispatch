// Relay-only content script — thin message forwarder.
// No Redux, no DOM observers, no DAT logic.
// Injects relayScript.js, listens for intercepted loads, forwards to background.

const isContextValid = (): boolean => {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
};

// Inject the Relay fetch interceptor into the page
const src = chrome.runtime.getURL('relayScript.js');
const s = document.createElement('script');
s.setAttribute('type', 'text/javascript');
s.src = src;
(document.head || document.documentElement).appendChild(s);
console.log('[Hustle:relayContent] Injected relayScript.js');

// Listen for intercepted Relay loads from the injected script
window.addEventListener('message', (event) => {
  if (!isContextValid()) return;

  const { type, payload } = event.data;
  if (type !== 'HUSTLE_RELAY_LOADS') return;

  const workOpportunities = payload?.workOpportunities;
  const count = Array.isArray(workOpportunities) ? workOpportunities.length : 0;
  console.log(`[Hustle:relayContent] Received ${count} loads, forwarding to background`);

  // Update badge via background
  chrome.runtime.sendMessage({ type: 'RELAY_LOAD_COUNT', count });

  // Push loads to API via background
  chrome.runtime.sendMessage(
    { type: 'PUSH_RELAY_LOADS', data: payload },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Hustle:relayContent] Push failed:', chrome.runtime.lastError.message);
        return;
      }
      console.log('[Hustle:relayContent] Push result:', response);
    },
  );
});

console.log('[Hustle:relayContent] Ready — listening for Relay loads');
