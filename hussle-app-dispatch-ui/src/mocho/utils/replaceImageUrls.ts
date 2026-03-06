/**
 * Replace Image URLs Utility
 *
 * Replaces blob URLs in HTML content with CDN URLs after successful upload.
 * Used by sagas to update content after images are uploaded to S3.
 */

/**
 * Mapping of placeholder IDs to CDN URLs returned by the backend
 */
export type ImageUrlMapping = Record<string, string>;

/**
 * Result of the replacement operation
 */
export interface ReplaceImagesResult {
  /** Updated HTML content with CDN URLs */
  content: string;
  /** Number of images replaced */
  replacedCount: number;
  /** Placeholder IDs that were successfully replaced */
  replacedIds: string[];
  /** Placeholder IDs that couldn't be found in the mapping */
  missingIds: string[];
}

/**
 * Replaces blob URLs with CDN URLs in HTML content
 *
 * @param htmlContent - The HTML content containing blob URLs
 * @param urlMapping - Mapping of placeholder IDs to CDN URLs
 * @returns Result with updated content and replacement statistics
 *
 * @example
 * ```typescript
 * const mapping = {
 *   'img-123-abc': 'https://cdn.example.com/blog-images/post-123-abc-medium.webp',
 *   'img-456-def': 'https://cdn.example.com/blog-images/post-456-def-medium.webp'
 * };
 *
 * const result = replaceImageUrls(content, mapping);
 * console.log(result.replacedCount); // 2
 * ```
 */
export function replaceImageUrls(
  htmlContent: string,
  urlMapping: ImageUrlMapping
): ReplaceImagesResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img[data-placeholder-id]');

  const replacedIds: string[] = [];
  const missingIds: string[] = [];
  let replacedCount = 0;

  images.forEach((img) => {
    const placeholderId = img.getAttribute('data-placeholder-id');

    if (!placeholderId) {
      return;
    }

    const cdnUrl = urlMapping[placeholderId];

    if (cdnUrl) {
      // Replace blob URL with CDN URL
      img.setAttribute('src', cdnUrl);

      // Remove placeholder ID attribute (no longer needed)
      img.removeAttribute('data-placeholder-id');

      replacedIds.push(placeholderId);
      replacedCount++;
    } else {
      // Placeholder ID not found in mapping
      missingIds.push(placeholderId);
    }
  });

  // Serialize back to HTML string
  const updatedContent = doc.body.innerHTML;

  return {
    content: updatedContent,
    replacedCount,
    replacedIds,
    missingIds,
  };
}

/**
 * Validates that all placeholder IDs in content have corresponding CDN URLs
 *
 * @param htmlContent - The HTML content to validate
 * @param urlMapping - The URL mapping to validate against
 * @returns Validation result with missing IDs if any
 */
export function validateImageMapping(
  htmlContent: string,
  urlMapping: ImageUrlMapping
): {
  valid: boolean;
  missingIds: string[];
  message?: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img[data-placeholder-id]');

  const missingIds: string[] = [];

  images.forEach((img) => {
    const placeholderId = img.getAttribute('data-placeholder-id');

    if (placeholderId && !urlMapping[placeholderId]) {
      missingIds.push(placeholderId);
    }
  });

  if (missingIds.length > 0) {
    return {
      valid: false,
      missingIds,
      message: `Missing CDN URLs for ${missingIds.length} image(s): ${missingIds.join(', ')}`,
    };
  }

  return {
    valid: true,
    missingIds: [],
  };
}

/**
 * Extracts all blob URLs from HTML content
 * Useful for cleanup after successful replacement
 *
 * @param htmlContent - The HTML content to parse
 * @returns Array of blob URLs found in the content
 */
export function extractBlobUrls(htmlContent: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img[src^="blob:"]');

  const blobUrls: string[] = [];

  images.forEach((img) => {
    const src = img.getAttribute('src');
    if (src) {
      blobUrls.push(src);
    }
  });

  return blobUrls;
}

/**
 * Counts images with placeholder IDs in HTML content
 *
 * @param htmlContent - The HTML content to analyze
 * @returns Count of images with placeholder IDs
 */
export function countPlaceholderImages(htmlContent: string): number {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img[data-placeholder-id]');

  return images.length;
}

/**
 * Checks if HTML content contains any blob URLs
 *
 * @param htmlContent - The HTML content to check
 * @returns true if any blob URLs are found
 */
export function hasBlobUrls(htmlContent: string): boolean {
  return htmlContent.includes('blob:');
}

/**
 * Safely replaces image URLs with error handling
 * Returns original content if replacement fails
 *
 * @param htmlContent - The HTML content containing blob URLs
 * @param urlMapping - Mapping of placeholder IDs to CDN URLs
 * @returns Result with updated content or original content on error
 */
export function safeReplaceImageUrls(
  htmlContent: string,
  urlMapping: ImageUrlMapping
): ReplaceImagesResult {
  try {
    return replaceImageUrls(htmlContent, urlMapping);
  } catch (error) {
    console.error('Error replacing image URLs:', error);

    return {
      content: htmlContent,
      replacedCount: 0,
      replacedIds: [],
      missingIds: [],
    };
  }
}
