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
export function generatePlaceholderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `img-${timestamp}-${random}`;
}

/**
 * Creates an ImageState object from a File
 * Automatically generates blob URL and placeholder ID
 *
 * @param file - The File object to create state for
 * @returns ImageState object with blob URL and metadata
 */
export function createImageState(file: File): ImageState {
  const blobUrl = URL.createObjectURL(file);
  const placeholderId = generatePlaceholderId();

  return {
    file,
    blobUrl,
    placeholderId,
    filename: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Revokes a single blob URL to free memory
 *
 * @param blobUrl - The blob URL to revoke
 */
export function revokeBlobUrl(blobUrl: string): void {
  try {
    URL.revokeObjectURL(blobUrl);
  } catch (_error) {
    // Blob URL revocation failed — non-critical, memory will be freed on page unload
  }
}

/**
 * Revokes a blob URL from an ImageState object
 *
 * @param imageState - The ImageState containing the blob URL to revoke
 */
export function revokeImageState(imageState: ImageState): void {
  revokeBlobUrl(imageState.blobUrl);
}

/**
 * Revokes all blob URLs from a collection of ImageState objects
 * Useful for cleanup on component unmount
 *
 * @param imageStates - Array or Map of ImageState objects
 */
export function revokeAllBlobUrls(imageStates: ImageState[] | Map<string, ImageState>): void {
  if (Array.isArray(imageStates)) {
    imageStates.forEach(revokeImageState);
  } else {
    imageStates.forEach(revokeImageState);
  }
}

/**
 * Validates if a file is a supported image type
 *
 * @param file - The file to validate
 * @returns true if the file is a valid image type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type.toLowerCase());
}

/**
 * Validates if a file is within the size limit
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes (default: 10MB)
 * @returns true if the file is within the size limit
 */
export function isValidImageSize(file: File, maxSizeMB = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validates an image file for both type and size
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes (default: 10MB)
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
  file: File,
  maxSizeMB = 10
): { valid: boolean; error?: string } {
  if (!isValidImageType(file)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  if (!isValidImageSize(file, maxSizeMB)) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`,
    };
  }

  return { valid: true };
}

/**
 * Formats file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extracts placeholder IDs from HTML content
 * Finds all image tags with blob URLs and extracts their data-placeholder-id attributes
 *
 * @param html - HTML content to parse
 * @returns Array of placeholder IDs found in the content
 */
export function extractPlaceholderIds(html: string): string[] {
  const placeholderIds: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img[data-placeholder-id]');

  images.forEach((img) => {
    const placeholderId = img.getAttribute('data-placeholder-id');
    if (placeholderId) {
      placeholderIds.push(placeholderId);
    }
  });

  return placeholderIds;
}

/**
 * Creates a mapping of placeholder IDs to their image states
 * Useful for passing to FormData builder
 *
 * @param imageStates - Map of image states
 * @returns Record mapping placeholder IDs to filenames
 */
export function createPlaceholderMapping(
  imageStates: Map<string, ImageState>
): Record<string, string> {
  const mapping: Record<string, string> = {};

  imageStates.forEach((state, placeholderId) => {
    mapping[placeholderId] = state.filename;
  });

  return mapping;
}
