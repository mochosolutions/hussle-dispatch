// (() => {
//     chrome.runtime.onInstalled.addListener(() => {
//         console.log("extension Installed....")
//         // chrome.action.setBadgeText({
//         //   text: "OFF",
//         // });
//       });


//     chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//       console.log("BG Handling the message", message)
//       switch (message.type) {
//         case 'popupInit':
//             // response(tabStorage[msg.tabId]);
//             sendResponse({"message": "Heyy"})
//         default:
//             // response('unknown request')
//             console.log("Unknow Message", message);
//             sendResponse({"msg": "resonse message", "type": "responseType"})
//     }
//       });
// })()

chrome.runtime.onInstalled.addListener(() => {
  console.log("extension Installed....")
});

// Throttled API push state
let lastPushTime = 0;

const pushRelayLoadsToApi = async (responseData: unknown): Promise<{ ok: boolean; error?: string }> => {
  const storage = await chrome.storage.local.get(['authToken', 'pushIntervalSeconds']);
  const authToken = storage.authToken as string | undefined;

  if (!authToken) {
    return { ok: false, error: 'No auth token' };
  }

  const intervalMs = ((storage.pushIntervalSeconds as number | undefined) ?? 60) * 1000;
  const now = Date.now();
  if (now - lastPushTime < intervalMs) {
    return { ok: false, error: 'Throttled' };
  }
  lastPushTime = now;

  const data = responseData as Record<string, unknown>;
  const workOpportunities = data.workOpportunities;
  if (!Array.isArray(workOpportunities) || workOpportunities.length === 0) {
    return { ok: false, error: 'No workOpportunities in response' };
  }

  const response = await fetch('http://localhost:3001/api/v1/load-board/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      source: 'relay',
      loads: workOpportunities,
    }),
  });

  if (response.status === 401) {
    await chrome.storage.local.remove('authToken');
    return { ok: false, error: 'Token expired, cleared' };
  }

  if (!response.ok) {
    return { ok: false, error: `API returned ${response.status}` };
  }

  const result = await response.json();
  console.log('[Hustle] Pushed relay loads to API:', result);
  return { ok: true };
};


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("BG Handling the message", message)
  switch (message.type) {
    case 'popupInit':
        sendResponse({"message": "Heyy"})
        break;
    case 'RELAY_LOAD_COUNT': {
        const { count } = message;
        chrome.storage.local.set({ relayLoadCount: count, relayLastUpdated: Date.now() });
        chrome.action.setBadgeText({ text: String(count) });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        console.log(`[Hustle] Relay load count: ${count}`)
        sendResponse({ ok: true })
        break;
    }
    case 'PUSH_RELAY_LOADS': {
        pushRelayLoadsToApi(message.data)
          .then((result) => sendResponse(result))
          .catch((err: unknown) => {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error('[Hustle] Push relay loads error:', errMsg);
            sendResponse({ ok: false, error: errMsg });
          });
        return true; // Keep message channel open for async response
    }
    default:
        sendResponse({"msg": "unknown message type", "type": message.type})
  }
});