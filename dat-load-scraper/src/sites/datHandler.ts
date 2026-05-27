import type { SiteHandler, SiteInterceptResult } from './siteHandler';
import { combinedExactAndSimilarLoadData } from '../utils/removeDuplicates';

const DAT_HOST = 'freight.api.prod.dat.com';
const DAT_SEARCH_PATH = '/trucker-api-web/api/v2/freightMatching/search';

export const datHandler: SiteHandler = {
  name: 'dat',
  transport: 'xhr',

  match(host: string, path: string): boolean {
    return host === DAT_HOST && path === DAT_SEARCH_PATH;
  },

  parse(responseData: unknown): SiteInterceptResult | null {
    const data = responseData as Record<string, unknown>;
    const { matchCounts, matchDetails, similarMatchDetails } = data;
    const datLoads = combinedExactAndSimilarLoadData({ matchDetails, matchCounts, similarMatchDetails });

    return {
      actionType: 'STORE_DAT_LOADS',
      payload: { data: datLoads },
    };
  },
};
