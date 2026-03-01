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
export declare function replaceImageUrls(htmlContent: string, urlMapping: ImageUrlMapping): ReplaceImagesResult;
/**
 * Validates that all placeholder IDs in content have corresponding CDN URLs
 *
 * @param htmlContent - The HTML content to validate
 * @param urlMapping - The URL mapping to validate against
 * @returns Validation result with missing IDs if any
 */
export declare function validateImageMapping(htmlContent: string, urlMapping: ImageUrlMapping): {
    valid: boolean;
    missingIds: string[];
    message?: string;
};
/**
 * Extracts all blob URLs from HTML content
 * Useful for cleanup after successful replacement
 *
 * @param htmlContent - The HTML content to parse
 * @returns Array of blob URLs found in the content
 */
export declare function extractBlobUrls(htmlContent: string): string[];
/**
 * Counts images with placeholder IDs in HTML content
 *
 * @param htmlContent - The HTML content to analyze
 * @returns Count of images with placeholder IDs
 */
export declare function countPlaceholderImages(htmlContent: string): number;
/**
 * Checks if HTML content contains any blob URLs
 *
 * @param htmlContent - The HTML content to check
 * @returns true if any blob URLs are found
 */
export declare function hasBlobUrls(htmlContent: string): boolean;
/**
 * Safely replaces image URLs with error handling
 * Returns original content if replacement fails
 *
 * @param htmlContent - The HTML content containing blob URLs
 * @param urlMapping - Mapping of placeholder IDs to CDN URLs
 * @returns Result with updated content or original content on error
 */
export declare function safeReplaceImageUrls(htmlContent: string, urlMapping: ImageUrlMapping): ReplaceImagesResult;
//# sourceMappingURL=replaceImageUrls.d.ts.map