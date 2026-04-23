// Injected into relay.amazon.com pages — intercepts fetch responses
// for /api/loadboard/search and posts workOpportunities to the content script.
// No DAT logic, no XHR interception, no site handler framework.

const RELAY_HOST = 'relay.amazon.com';
const SEARCH_PATH = '/api/loadboard/search';

(function () {
  const originalFetch = window.fetch;

  window.fetch = function (...args) {
    const request = args[0];
    const requestUrl =
      typeof request === 'string' ? request : request instanceof Request ? request.url : '';

    return originalFetch.apply(this, args).then((response) => {
      try {
        const resolvedUrl = response.url || requestUrl;
        if (!resolvedUrl) return response;

        const urlObj = new URL(resolvedUrl);
        const isRelaySearch =
          urlObj.host.includes(RELAY_HOST) && urlObj.pathname === SEARCH_PATH;

        if (!isRelaySearch) return response;

        console.log('[Hustle:relayScript] Intercepted Relay search response');

        return response.arrayBuffer().then((buf) => {
          try {
            const text = new TextDecoder().decode(buf);
            const data = JSON.parse(text);
            const count = Array.isArray(data.workOpportunities)
              ? data.workOpportunities.length
              : 0;

            console.log(
              `[Hustle:relayScript] workOpportunities: ${count}, totalResults: ${data.totalResultsSize ?? 0}`,
            );

            window.postMessage({
              type: 'HUSTLE_RELAY_LOADS',
              payload: data,
            });
          } catch (parseErr) {
            console.error('[Hustle:relayScript] JSON parse error:', parseErr);
          }

          return new Response(buf, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        });
      } catch {
        // ignore
      }

      return response;
    });
  };

  console.log('[Hustle:relayScript] Fetch interceptor installed');
})();
