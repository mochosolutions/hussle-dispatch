/**
 * Organization Slug Validator
 *
 * Validates slugs used in public URLs for organizations.
 * Slugs must be URL-safe, lowercase, and unique.
 */

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RESERVED_SLUGS = [
  'admin',
  'api',
  'auth',
  'health',
  'www',
  'app',
  'dashboard',
  'login',
  'logout',
  'register',
  'signup',
  'settings',
  'profile',
  'account',
  'billing',
  'support',
  'help',
  'docs',
  'blog',
  'static',
  'assets',
  'public',
  'private',
  'internal',
  'system',
  'root',
  'null',
  'undefined',
];

export interface SlugValidationResult {
  valid: boolean;
  error?: string;
}

export const validateSlug = (slug: string): SlugValidationResult => {
  if (!slug) {
    return { valid: false, error: 'Slug is required' };
  }

  if (slug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' };
  }

  if (slug.length > 50) {
    return { valid: false, error: 'Slug must be at most 50 characters' };
  }

  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen',
    };
  }

  if (slug.includes('--')) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: `"${slug}" is a reserved slug` };
  }

  return { valid: true };
};

export const isValidSlug = (slug: string): boolean => validateSlug(slug).valid;

export const generateSlug = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const getReservedSlugs = (): string[] => [...RESERVED_SLUGS];
