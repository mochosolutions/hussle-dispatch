/**
 * Generate URL-friendly slug from text
 * Converts text to lowercase, replaces spaces with hyphens, removes special characters
 *
 * @example
 * generateSlug('Hello World!') // 'hello-world'
 * generateSlug('TypeScript & React') // 'typescript-react'
 * generateSlug('  Multiple   Spaces  ') // 'multiple-spaces'
 *
 * @param text - Text to convert to slug
 * @returns URL-friendly slug string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()              // Convert to lowercase
    .trim()                     // Remove leading/trailing whitespace
    .replace(/[^\w\s-]/g, '')  // Remove non-word characters (except spaces and hyphens)
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
}
