import type { SiteHandler, SiteInterceptResult } from './siteHandler';

const RELAY_HOST = 'relay.amazon.com';
const SEARCH_PATH = '/api/loadboard/search';

export const relayHandler: SiteHandler = {
  name: 'relay',
  transport: 'fetch',

  match(host: string, path: string): boolean {
    const matched = host.includes(RELAY_HOST) && path === SEARCH_PATH;
    console.log(`[Hustle:relayHandler] match check — host=${host} path=${path} → ${matched}`);
    return matched;
  },

  parse(responseData: unknown, path: string, method: string): SiteInterceptResult | null {
    console.log(`[Hustle:relayHandler] parse called — ${method} ${path}`);
    const data = responseData as Record<string, unknown>;
    const workOpportunities = data.workOpportunities as unknown[] | undefined;
    const totalResultsSize = (data.totalResultsSize as number) ?? 0;
    const pageCount = workOpportunities?.length ?? 0;
    console.log(`[Hustle:relayHandler] workOpportunities=${pageCount}, totalResults=${totalResultsSize}`);

    return {
      actionType: 'STORE_RELAY_LOADS',
      payload: { path, method, data },
      storageUpdate: {
        relayLoadCount: totalResultsSize,
        relayPageCount: pageCount,
        relayLastUpdated: Date.now(),
      },
    };
  },
};
