export interface CreateShortLinkPortInput {
  targetUrl: string;
  loadId: string;
  purpose: string;
  expiresAt: Date;
}

export interface ShortLinkServicePort {
  createShortLink(
    input: CreateShortLinkPortInput,
  ): Promise<{ slug: string }>;
}
