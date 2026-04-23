import type { SiteHandler } from './siteHandler';
import { datHandler } from './datHandler';
import { relayHandler } from './relayHandler';

// Register all site handlers here — add new sites by importing and appending
export const siteHandlers: SiteHandler[] = [
  datHandler,
  relayHandler,
];

export type { SiteHandler, SiteInterceptResult } from './siteHandler';
