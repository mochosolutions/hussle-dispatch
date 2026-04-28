import type { ShortLink } from '@prisma/client';
import { createShortLinkService } from '../services/shortLinkService';
import type { ShortLinkRepoPort } from '../types/shortLinkRepoPort';

const makeRow = (overrides: Partial<ShortLink> = {}): ShortLink => ({
  id: overrides.id ?? 'sl-1',
  slug: overrides.slug ?? 'AbCd1234',
  targetUrl: overrides.targetUrl ?? 'https://example.com/long',
  loadId: overrides.loadId ?? 'load-1',
  purpose: overrides.purpose ?? 'DRIVER_PORTAL',
  expiresAt: overrides.expiresAt ?? new Date('2099-01-01T00:00:00Z'),
  clickCount: overrides.clickCount ?? 0,
  lastClickedAt: overrides.lastClickedAt ?? null,
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
});

const buildDeps = () => {
  const repo: jest.Mocked<ShortLinkRepoPort> = {
    findBySlug: jest.fn(),
    create: jest.fn(),
    incrementClick: jest.fn().mockResolvedValue(undefined),
  };
  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return { repo, logger };
};

describe('shortLinkService.createShortLink', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a row with passed targetUrl/loadId/purpose/expiresAt and returns the slug', async () => {
    const { repo, logger } = buildDeps();
    repo.create.mockResolvedValue(makeRow({ slug: 'SLUG0001' }));
    const service = createShortLinkService({
      repo,
      logger,
      generateSlug: () => 'SLUG0001',
    });

    const result = await service.createShortLink({
      targetUrl: 'https://example.com/long',
      loadId: 'load-1',
      purpose: 'DRIVER_PORTAL',
      expiresAt: new Date('2099-01-01T00:00:00Z'),
    });

    expect(result).toEqual({ slug: 'SLUG0001' });
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith({
      slug: 'SLUG0001',
      targetUrl: 'https://example.com/long',
      loadId: 'load-1',
      purpose: 'DRIVER_PORTAL',
      expiresAt: new Date('2099-01-01T00:00:00Z'),
    });
  });

  it('retries up to 3 times when Prisma reports P2002 and returns the final slug', async () => {
    const { repo, logger } = buildDeps();
    const collision = Object.assign(new Error('unique violation'), {
      code: 'P2002',
    });
    repo.create
      .mockRejectedValueOnce(collision)
      .mockRejectedValueOnce(collision)
      .mockResolvedValueOnce(makeRow({ slug: 'attempt3' }));

    const slugs = ['attempt1', 'attempt2', 'attempt3'];
    let i = 0;
    const service = createShortLinkService({
      repo,
      logger,
      generateSlug: () => slugs[i++] ?? 'fallback',
    });

    const result = await service.createShortLink({
      targetUrl: 'https://example.com/long',
      loadId: 'load-1',
      purpose: 'DRIVER_PORTAL',
      expiresAt: new Date('2099-01-01T00:00:00Z'),
    });

    expect(result.slug).toBe('attempt3');
    expect(repo.create).toHaveBeenCalledTimes(3);
  });

  it('throws after 3 P2002 collisions', async () => {
    const { repo, logger } = buildDeps();
    const collision = Object.assign(new Error('unique violation'), {
      code: 'P2002',
    });
    repo.create.mockRejectedValue(collision);

    const service = createShortLinkService({
      repo,
      logger,
      generateSlug: () => 'sameslug',
    });

    await expect(
      service.createShortLink({
        targetUrl: 'https://example.com/long',
        loadId: 'load-1',
        purpose: 'DRIVER_PORTAL',
        expiresAt: new Date('2099-01-01T00:00:00Z'),
      }),
    ).rejects.toBe(collision);

    expect(repo.create).toHaveBeenCalledTimes(3);
  });

  it('rethrows non-P2002 errors immediately without retry', async () => {
    const { repo, logger } = buildDeps();
    const otherError = new Error('boom');
    repo.create.mockRejectedValueOnce(otherError);

    const service = createShortLinkService({
      repo,
      logger,
      generateSlug: () => 'SLUG0001',
    });

    await expect(
      service.createShortLink({
        targetUrl: 'https://example.com/long',
        loadId: null,
        purpose: 'DRIVER_PORTAL',
        expiresAt: new Date('2099-01-01T00:00:00Z'),
      }),
    ).rejects.toBe(otherError);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

describe('shortLinkService.resolveSlug', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when slug does not exist', async () => {
    const { repo, logger } = buildDeps();
    repo.findBySlug.mockResolvedValue(null);
    const service = createShortLinkService({ repo, logger });

    const result = await service.resolveSlug('missing1');

    expect(result).toBeNull();
    expect(repo.incrementClick).not.toHaveBeenCalled();
  });

  it('returns null when slug is expired', async () => {
    const { repo, logger } = buildDeps();
    repo.findBySlug.mockResolvedValue(
      makeRow({ expiresAt: new Date(Date.now() - 1000) }),
    );
    const service = createShortLinkService({ repo, logger });

    const result = await service.resolveSlug('expired1');

    expect(result).toBeNull();
    expect(repo.incrementClick).not.toHaveBeenCalled();
  });

  it('returns the targetUrl and fires-and-forgets incrementClick on active slug', async () => {
    const { repo, logger } = buildDeps();
    repo.findBySlug.mockResolvedValue(
      makeRow({ slug: 'active01', targetUrl: 'https://example.com/long' }),
    );
    const service = createShortLinkService({ repo, logger });

    const result = await service.resolveSlug('active01');

    expect(result).toEqual({ targetUrl: 'https://example.com/long' });
    expect(repo.incrementClick).toHaveBeenCalledWith('active01', expect.any(Date));
  });

  it('still resolves when incrementClick fails (fire-and-forget)', async () => {
    const { repo, logger } = buildDeps();
    repo.findBySlug.mockResolvedValue(
      makeRow({ targetUrl: 'https://example.com/x' }),
    );
    repo.incrementClick.mockRejectedValueOnce(new Error('db down'));
    const service = createShortLinkService({ repo, logger });

    const result = await service.resolveSlug('active01');

    expect(result).toEqual({ targetUrl: 'https://example.com/x' });
    // Allow the rejected promise to settle so the .catch handler logs it.
    await new Promise((resolve) => setImmediate(resolve));
    expect(logger.warn).toHaveBeenCalled();
  });
});
