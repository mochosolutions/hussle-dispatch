import type { Logger } from '@/shared/utils/logger';
import { generateShortSlug } from '@/shared/utils/generateShortSlug';
import type { ShortLinkRepoPort } from '../types/shortLinkRepoPort';
import type {
  CreateShortLinkInput,
  CreateShortLinkResult,
  ResolveSlugResult,
} from '../types/shortLinkServiceTypes';

const MAX_SLUG_ATTEMPTS = 3;

const isPrismaUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export interface ShortLinkServiceDeps {
  repo: ShortLinkRepoPort;
  logger: Logger;
  generateSlug?: () => string;
}

export interface ShortLinkService {
  createShortLink(input: CreateShortLinkInput): Promise<CreateShortLinkResult>;
  resolveSlug(slug: string): Promise<ResolveSlugResult>;
}

export const createShortLinkService = (
  deps: ShortLinkServiceDeps,
): ShortLinkService => {
  const generateSlug = deps.generateSlug ?? generateShortSlug;

  const tryCreate = async (
    input: CreateShortLinkInput,
    attempt: number,
  ): Promise<CreateShortLinkResult> => {
    const slug = generateSlug();
    try {
      await deps.repo.create({
        slug,
        targetUrl: input.targetUrl,
        loadId: input.loadId,
        purpose: input.purpose,
        expiresAt: input.expiresAt,
      });
      return { slug };
    } catch (error: unknown) {
      if (!isPrismaUniqueViolation(error)) {
        throw error;
      }
      deps.logger.warn('Short-link slug collision — retrying', {
        attempt,
        slug,
      });
      if (attempt >= MAX_SLUG_ATTEMPTS) {
        throw error;
      }
      return tryCreate(input, attempt + 1);
    }
  };

  const createShortLink = (
    input: CreateShortLinkInput,
  ): Promise<CreateShortLinkResult> => tryCreate(input, 1);

  const resolveSlug = async (slug: string): Promise<ResolveSlugResult> => {
    const row = await deps.repo.findBySlug(slug);
    if (row === null || row.expiresAt.getTime() < Date.now()) {
      return null;
    }

    deps.repo.incrementClick(slug, new Date()).catch((error: unknown) => {
      deps.logger.warn('Failed to increment short-link click count', {
        slug,
        error: errorMessage(error),
      });
    });

    return { targetUrl: row.targetUrl };
  };

  return { createShortLink, resolveSlug };
};
