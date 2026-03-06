/**
 * Blog Image URL Utilities
 *
 * The API returns fully-qualified absolute URLs for all blog images.
 * These utilities provide simple helpers for working with blog images.
 */

// Default blog hero image (served from Admin UI public folder)
export const DEFAULT_BLOG_HERO_IMAGE = '/images/defaults/blog-default-hero-medium.webp';

/**
 * Get the display URL for a blog image
 *
 * @param url - Image URL from API (should be absolute) or undefined/null
 * @returns The URL or default blog hero image if not provided
 *
 * @example
 * getBlogImageUrl('https://cdn.mochosolutions.com/blog-images/post.webp')
 * // → 'https://cdn.mochosolutions.com/blog-images/post.webp'
 *
 * @example
 * getBlogImageUrl(undefined)
 * // → '/images/defaults/blog-default-hero-medium.webp'
 */
export function getBlogImageUrl(url: string | undefined | null): string {
  if (!url || url.trim() === '') {
    return DEFAULT_BLOG_HERO_IMAGE;
  }
  return url;
}

/**
 * Check if a URL is external (absolute)
 *
 * @param url - URL to check
 * @returns true if URL is absolute (starts with http/https)
 */
export function isExternalUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Extract image URL from a hero image object
 *
 * @param heroImage - Hero image object from API or undefined
 * @returns The URL string or null
 */
export function extractHeroImageUrl(heroImage: { url?: string } | null | undefined): string | null {
  if (!heroImage || typeof heroImage !== 'object') {
    return null;
  }
  return heroImage.url || null;
}

/**
 * Extract alt text from a hero image object
 *
 * @param heroImage - Hero image object from API or undefined
 * @returns The alt text or empty string
 */
export function extractHeroImageAlt(heroImage: { alt?: string } | null | undefined): string {
  if (!heroImage || typeof heroImage !== 'object') {
    return '';
  }
  return heroImage.alt || '';
}

/**
 * Extract caption from a hero image object
 *
 * @param heroImage - Hero image object from API or undefined
 * @returns The caption or empty string
 */
export function extractHeroImageCaption(heroImage: { caption?: string } | null | undefined): string {
  if (!heroImage || typeof heroImage !== 'object') {
    return '';
  }
  return heroImage.caption || '';
}
