import type { PrismaClient } from '@prisma/client';
import type { ShortLinkRepoPort } from '../types/shortLinkRepoPort';

type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export const shortLinkRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): ShortLinkRepoPort => ({
  findBySlug: async (slug) =>
    prisma.shortLink.findUnique({ where: { slug } }),

  create: async (data) =>
    prisma.shortLink.create({
      data: {
        slug: data.slug,
        targetUrl: data.targetUrl,
        loadId: data.loadId,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
      },
    }),

  incrementClick: async (slug, clickedAt) => {
    await prisma.shortLink.update({
      where: { slug },
      data: {
        clickCount: { increment: 1 },
        lastClickedAt: clickedAt,
      },
    });
  },
});
