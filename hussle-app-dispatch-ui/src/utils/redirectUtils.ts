/**
 * Redirect URL validation utilities
 *
 * These utilities validate and sanitize redirect URLs to prevent open redirect attacks.
 * Only internal paths and whitelisted external domains are allowed.
 */

export const VITE_MARKETING_SITE_URL =
  import.meta.env.VITE_MARKETING_SITE_URL || 'http://localhost:3000';

/**
 * Get allowed external hosts from a marketing site URL
 */
export const getAllowedExternalHosts = (
  marketingSiteUrl: string = VITE_MARKETING_SITE_URL,
): string[] => {
  try {
    const marketingUrl = new URL(marketingSiteUrl);
    return [marketingUrl.host];
  } catch {
    return ['localhost:3000'];
  }
};

/**
 * Check if a URL is external (different origin than current window)
 */
export const isExternalUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
};

/**
 * Check if a URL is an allowed redirect destination
 * - Internal paths (starting with /) are allowed
 * - External URLs must be in the allowlist
 * - Protocol-relative URLs (//) are rejected
 * - javascript:, data:, and other dangerous protocols are rejected
 */
export const isAllowedRedirect = (
  url: string,
  allowedHosts: string[] = getAllowedExternalHosts(),
): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Reject protocol-relative URLs
  if (url.startsWith('//')) {
    return false;
  }

  // Allow internal paths (must start with single /)
  if (url.startsWith('/') && !url.startsWith('//')) {
    // Reject dangerous protocols in path-like strings
    if (url.toLowerCase().includes('javascript:')) {
      return false;
    }
    return true;
  }

  // Check external URLs against allowlist
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    return allowedHosts.some((host) => parsed.host === host);
  } catch {
    return false;
  }
};

/**
 * Get a validated redirect URL, falling back to default if invalid
 */
export const getValidRedirectUrl = (returnTo?: string | null, defaultUrl = '/'): string => {
  if (!returnTo) {
    return defaultUrl;
  }

  if (!isAllowedRedirect(returnTo)) {
    return defaultUrl;
  }

  return returnTo;
};
