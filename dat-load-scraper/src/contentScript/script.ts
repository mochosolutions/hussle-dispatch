import { siteHandlers } from '../sites';

const createUrlObj = (url: string) => {
    const urlObj = new URL(url);
    return { host: urlObj.host, path: urlObj.pathname };
};

(function () {
    const xhrHandlers = siteHandlers.filter((h) => h.transport === 'xhr' || h.transport === 'both');
    const fetchHandlers = siteHandlers.filter((h) => h.transport === 'fetch' || h.transport === 'both');

    // --- XHR interceptor (DAT and other XHR-based sites) ---
    const XHR = XMLHttpRequest.prototype;
    const originalOpen = XHR.open;
    const originalSend = XHR.send;

    XHR.open = function (method, url) {
        this._method = method;
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    XHR.send = function (postData) {
        const self = this;

        this.addEventListener('readystatechange', () => {
            try {
                if (self.readyState === 4 && self.responseURL) {
                    const { host, path } = createUrlObj(self.responseURL);

                    xhrHandlers.forEach((handler) => {
                        if (handler.match(host, path)) {
                            const responseData = JSON.parse(self.responseText);
                            const result = handler.parse(responseData, path, self._method);
                            if (result) {
                                console.log(`[Hustle] ${handler.name} XHR: ${path}`, responseData);
                                window.postMessage({
                                    type: result.actionType,
                                    payload: { ...result.payload, storageUpdate: result.storageUpdate },
                                });
                            }
                        }
                    });
                }
            } catch (e) {
                // non-JSON or parse error, ignore
            }
        }, false);

        return originalSend.apply(this, arguments);
    };

    // --- Fetch interceptor (Amazon Relay and other fetch-based sites) ---
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        const request = args[0];
        const requestUrl = typeof request === 'string' ? request : request instanceof Request ? request.url : '';

        return originalFetch.apply(this, args).then((response) => {
            try {
                const resolvedUrl = response.url || requestUrl;
                if (!resolvedUrl) return response;

                const { host, path } = createUrlObj(resolvedUrl);
                console.log(`[Hustle:fetch] intercepted — ${host}${path}`);

                const matchedHandler = fetchHandlers.find((handler) => handler.match(host, path));
                if (matchedHandler) {
                    console.log(`[Hustle:fetch] MATCHED handler: ${matchedHandler.name}`);
                    return response.arrayBuffer().then((buf) => {
                        try {
                            const text = new TextDecoder().decode(buf);
                            const responseData = JSON.parse(text);
                            const result = matchedHandler.parse(responseData, path, 'POST');
                            if (result) {
                                console.log(`[Hustle:fetch] posting message — type=${result.actionType}`, Object.keys(responseData));
                                window.postMessage({
                                    type: result.actionType,
                                    payload: { ...result.payload, storageUpdate: result.storageUpdate },
                                });
                            } else {
                                console.log(`[Hustle:fetch] handler returned null result`);
                            }
                        } catch (parseErr) {
                            console.log(`[Hustle:fetch] JSON parse error:`, parseErr);
                        }
                        return new Response(buf, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers,
                        });
                    });
                }
            } catch (e) {
                // ignore
            }

            return response;
        });
    };
})();
