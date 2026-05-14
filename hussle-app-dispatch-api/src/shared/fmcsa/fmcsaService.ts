/**
 * FMCSA lookup service — normalizes identifiers, applies dual-key caching,
 * retries provider errors with bounded backoff, and publishes lifecycle events.
 *
 * This module is a shared infrastructure utility (no controllers/routes) wired
 * via a factory: createFmcsaService(deps) => FmcsaService.
 */

import { randomUUID } from 'node:crypto';

import { BadRequestError } from '@mocho/common';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import type { CachePort } from './cachePort';
import type { FmcsaPort } from './fmcsaPort';
import type {
  FmcsaIdentifier,
  FmcsaLookupOpts,
  FmcsaLookupResult,
  FmcsaService,
  FmcsaSnapshot,
} from './types';

const CACHE_TTL_SECONDS = 86_400;
const RETRY_DELAYS_MS: readonly number[] = [1_000, 5_000, 30_000];

const buildKey = (identifier: FmcsaIdentifier): string =>
  `fmcsa:${identifier.type}:${identifier.value}`;

const normalize = (input: string): string => input.replace(/\D/g, '');

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export interface FmcsaServiceDeps {
  provider: FmcsaPort;
  cache: CachePort;
  eventBus: EventBus;
  logger: Logger;
  uuid?: () => string;
  sleep?: (ms: number) => Promise<void>;
}

export const createFmcsaService = (deps: FmcsaServiceDeps): FmcsaService => {
  const { provider, cache, eventBus, logger } = deps;
  const uuid = deps.uuid ?? randomUUID;
  const sleep = deps.sleep ?? defaultSleep;

  const emitCompleted = (
    correlationId: string,
    identifier: FmcsaIdentifier,
    result: { status: 'found'; snapshot: FmcsaSnapshot } | { status: 'not_found' },
  ): void => {
    eventBus
      .publish('fmcsa.lookup.completed', { correlationId, identifier, result })
      .catch((error: unknown) => {
        logger.warn('FMCSA event publish failed (completed)', {
          correlationId,
          error: errorMessage(error),
        });
      });
  };

  const emitFailed = (
    correlationId: string,
    identifier: FmcsaIdentifier,
    reason: 'timeout' | 'rate_limit' | 'provider_error',
  ): void => {
    eventBus
      .publish('fmcsa.lookup.failed', { correlationId, identifier, reason })
      .catch((error: unknown) => {
        logger.warn('FMCSA event publish failed (failed)', {
          correlationId,
          error: errorMessage(error),
        });
      });
  };

  const callProvider = (identifier: FmcsaIdentifier): Promise<FmcsaLookupResult> =>
    identifier.type === 'mc'
      ? provider.lookupByMcNumber(identifier.value)
      : provider.lookupByDotNumber(identifier.value);

  const callProviderWithRetry = async (
    identifier: FmcsaIdentifier,
  ): Promise<FmcsaLookupResult> => {
    let attempt = 0;
    let lastResult: FmcsaLookupResult = await callProvider(identifier);
    while (lastResult.status === 'error' && attempt < RETRY_DELAYS_MS.length) {
      logger.warn('FMCSA provider error — retrying', {
        identifier,
        attempt: attempt + 1,
        reason: lastResult.reason,
      });
      // noUncheckedIndexedAccess is on — narrow with explicit guard.
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay !== undefined) {
        await sleep(delay);
      }
      lastResult = await callProvider(identifier);
      attempt += 1;
    }
    return lastResult;
  };

  const cacheFoundResult = async (snapshot: FmcsaSnapshot): Promise<void> => {
    await cache.set(
      buildKey({ type: 'mc', value: snapshot.mcNumber }),
      snapshot,
      CACHE_TTL_SECONDS,
    );
    if (snapshot.dotNumber !== null && snapshot.dotNumber !== '') {
      await cache.set(
        buildKey({ type: 'dot', value: snapshot.dotNumber }),
        snapshot,
        CACHE_TTL_SECONDS,
      );
    }
  };

  const lookupAndEmit = async (
    identifier: FmcsaIdentifier,
    opts: FmcsaLookupOpts,
  ): Promise<FmcsaLookupResult> => {
    const correlationId = opts.correlationId ?? uuid();
    logger.info('FMCSA lookup started', { identifier, correlationId });

    if (opts.skipCache !== true) {
      const cached = await cache.get(buildKey(identifier));
      if (cached !== null) {
        logger.debug('FMCSA cache hit', { identifier });
        emitCompleted(correlationId, identifier, { status: 'found', snapshot: cached });
        return { status: 'found', snapshot: cached };
      }
    }

    const result = await callProviderWithRetry(identifier);

    if (result.status === 'found') {
      await cacheFoundResult(result.snapshot);
      emitCompleted(correlationId, identifier, {
        status: 'found',
        snapshot: result.snapshot,
      });
      return result;
    }
    if (result.status === 'not_found') {
      emitCompleted(correlationId, identifier, { status: 'not_found' });
      return result;
    }
    emitFailed(correlationId, identifier, result.reason);
    return result;
  };

  const validateAndBuildIdentifier = (
    type: 'mc' | 'dot',
    input: string,
  ): FmcsaIdentifier => {
    const value = normalize(input);
    if (value === '') {
      throw new BadRequestError(
        `FMCSA lookup requires at least one digit; got ${JSON.stringify(input)}`,
      );
    }
    return { type, value };
  };

  return {
    lookupByMcNumber: async (mc, opts = {}) =>
      lookupAndEmit(validateAndBuildIdentifier('mc', mc), opts),
    lookupByDotNumber: async (dot, opts = {}) =>
      lookupAndEmit(validateAndBuildIdentifier('dot', dot), opts),
    invalidateCache: (identifier) => cache.del(buildKey(identifier)),
  };
};
