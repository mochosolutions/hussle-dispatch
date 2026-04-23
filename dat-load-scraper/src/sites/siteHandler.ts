export interface SiteInterceptResult {
  actionType: string;
  payload: Record<string, unknown>;
  storageUpdate?: Record<string, unknown>;
}

export interface SiteHandler {
  name: string;
  /** Which transport this site uses for API calls */
  transport: 'xhr' | 'fetch' | 'both';
  /** Return true if this handler should process the given host + path */
  match(host: string, path: string): boolean;
  /** Parse the raw response JSON into a standardized action + optional storage update */
  parse(responseData: unknown, path: string, method: string): SiteInterceptResult | null;
}
