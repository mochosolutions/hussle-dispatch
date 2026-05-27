import type { ShortLink } from '@prisma/client';

export interface CreateShortLinkRow {
  slug: string;
  targetUrl: string;
  loadId: string | null;
  purpose: string;
  expiresAt: Date;
}

export interface ShortLinkRepoPort {
  findBySlug(slug: string): Promise<ShortLink | null>;
  create(data: CreateShortLinkRow): Promise<ShortLink>;
  incrementClick(slug: string, clickedAt: Date): Promise<void>;
}
