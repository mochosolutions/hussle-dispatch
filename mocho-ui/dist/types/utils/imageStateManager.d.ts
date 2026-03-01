/**
 * Image State Manager Utility
 *
 * Manages image files and their blob URLs for deferred upload pattern.
 * Provides helpers for creating, tracking, and cleaning up blob URLs.
 */
/**
 * Represents an image in memory with its blob URL for preview
 */
export interface ImageState {
    /** The actual File object to be uploaded */
    file: File;
    /** Blob URL for local preview (e.g., blob:http://localhost:3002/...) */
    blobUrl: string;
    /** Unique identifier for tracking (used to map to CDN URL after upload) */
    placeholderId: string;
    /** Original filename for reference */
    filename: string;
    /** File size in bytes */
    size: number;
    /** MIME type */
    type: string;
}
/**
 * Generates a unique placeholder ID for an image
 * Format: img-{timestamp}-{random}
 */
export declare function generatePlaceholderId(): string;
/**
 * Creates an ImageState object from a File
 * Automatically generates blob URL and placeholder ID
 *
 * @param file - The File object to create state for
 * @returns ImageState object with blob URL and metadata
 */
export declare function createImageState(file: File): ImageState;
/**
 * Revokes a single blob URL to free memory
 *
 * @param blobUrl - The blob URL to revoke
 */
export declare function revokeBlobUrl(blobUrl: string): void;
/**
 * Revokes a blob URL from an ImageState object
 *
 * @param imageState - The ImageState containing the blob URL to revoke
 */
export declare function revokeImageState(imageState: ImageState): void;
/**
 * Revokes all blob URLs from a collection of ImageState objects
 * Useful for cleanup on component unmount
 *
 * @param imageStates - Array or Map of ImageState objects
 */
export declare function revokeAllBlobUrls(imageStates: ImageState[] | Map<string, ImageState>): void;
/**
 * Validates if a file is a supported image type
 *
 * @param file - The file to validate
 * @returns true if the file is a valid image type
 */
export declare function isValidImageType(file: File): boolean;
/**
 * Validates if a file is within the size limit
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes (default: 10MB)
 * @returns true if the file is within the size limit
 */
export declare function isValidImageSize(file: File, maxSizeMB?: number): boolean;
/**
 * Validates an image file for both type and size
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes (default: 10MB)
 * @returns Validation result with error message if invalid
 */
export declare function validateImageFile(file: File, maxSizeMB?: number): {
    valid: boolean;
    error?: string;
};
/**
 * Formats file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Extracts placeholder IDs from HTML content
 * Finds all image tags with blob URLs and extracts their data-placeholder-id attributes
 *
 * @param html - HTML content to parse
 * @returns Array of placeholder IDs found in the content
 */
export declare function extractPlaceholderIds(html: string): string[];
/**
 * Creates a mapping of placeholder IDs to their image states
 * Useful for passing to FormData builder
 *
 * @param imageStates - Map of image states
 * @returns Record mapping placeholder IDs to filenames
 */
export declare function createPlaceholderMapping(imageStates: Map<string, ImageState>): Record<string, string>;
//# sourceMappingURL=imageStateManager.d.ts.map