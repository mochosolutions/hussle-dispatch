export interface CreateShortLinkInput {
  targetUrl: string;
  loadId: string | null;
  purpose: string;
  expiresAt: Date;
}

export interface CreateShortLinkResult {
  slug: string;
}

export type ResolveSlugResult = { targetUrl: string } | null;
