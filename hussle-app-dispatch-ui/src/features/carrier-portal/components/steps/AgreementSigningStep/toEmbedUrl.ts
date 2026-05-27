/**
 * DocuSeal sends `x-frame-options: SAMEORIGIN` which blocks iframing from the
 * carrier-portal origin. Route the iframe through the same-origin Vite dev
 * proxy at `/docuseal-embed/*` (vite.config.ts) which strips frame-blocking
 * headers. In prod the same path is proxied at the edge (nginx config).
 */
export const toEmbedUrl = (raw: string): string => {
  try {
    const url = new URL(raw);
    return `/docuseal-embed${url.pathname}${url.search}`;
  } catch {
    return raw;
  }
};
