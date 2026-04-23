/* eslint-disable */
// MV3 service worker — plain JS (not bundled by webpack)

console.log('[Hustle:background] Service worker started');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Hustle:background] Extension installed');
});

// Per-source throttle tracking
var lastPushTimes = {};

async function pushLoadsToApi(source, loads) {
  if (!Array.isArray(loads) || loads.length === 0) {
    return { ok: false, error: 'No loads to push' };
  }

  var storage = await chrome.storage.local.get(['pushIntervalSeconds']);
  var intervalMs = (storage.pushIntervalSeconds || 10) * 1000;
  var now = Date.now();
  var lastPush = lastPushTimes[source] || 0;

  if (now - lastPush < intervalMs) {
    return { ok: false, error: 'Throttled (' + source + ')' };
  }
  lastPushTimes[source] = now;

  console.log('[Hustle:background] Pushing ' + loads.length + ' ' + source + ' loads to API');

  var response = await fetch('http://localhost:3001/api/v1/load-board/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: source, loads: loads }),
  });

  if (!response.ok) {
    var errText = '';
    try { errText = await response.text(); } catch (_) {}
    console.error('[Hustle:background] API error ' + response.status + ':', errText);
    return { ok: false, error: 'API returned ' + response.status };
  }

  var result = await response.json();
  console.log('[Hustle:background] Push success:', result);

  // Update badge with total count
  chrome.action.setBadgeText({ text: String(loads.length) });
  chrome.action.setBadgeBackgroundColor({ color: source === 'relay' ? '#2196F3' : '#FF9800' });

  return { ok: true, count: result.data ? result.data.count : loads.length };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'popupInit':
      sendResponse({ message: 'ok' });
      break;

    case 'RELAY_LOAD_COUNT': {
      var count = message.count;
      chrome.storage.local.set({ relayLoadCount: count, relayLastUpdated: Date.now() });
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
      sendResponse({ ok: true });
      break;
    }

    case 'PUSH_RELAY_LOADS': {
      var workOpps = message.data && message.data.workOpportunities;
      if (!Array.isArray(workOpps)) {
        sendResponse({ ok: false, error: 'No workOpportunities in data' });
        break;
      }
      console.log('[Hustle:background] PUSH_RELAY_LOADS — ' + workOpps.length + ' loads');
      pushLoadsToApi('relay', workOpps)
        .then(function (r) { sendResponse(r); })
        .catch(function (e) { sendResponse({ ok: false, error: String(e) }); });
      return true;
    }

    case 'PUSH_DAT_LOADS': {
      var loads = message.loads;
      console.log('[Hustle:background] PUSH_DAT_LOADS — ' + (loads ? loads.length : 0) + ' loads');
      pushLoadsToApi('dat', loads || [])
        .then(function (r) { sendResponse(r); })
        .catch(function (e) { sendResponse({ ok: false, error: String(e) }); });
      return true;
    }

    default:
      sendResponse({ msg: 'unknown message type', type: message.type });
  }
});
