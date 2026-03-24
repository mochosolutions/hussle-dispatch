/**
 * Deferred Image Upload Utilities
 *
 * Handles the deferred upload pattern for both hero images and inline images.
 * Called on form submit to upload images via presigned URLs.
 */

import { ImageState } from './imageStateManager';
import {
  requestPresignedUrl,
  uploadToS3,
  uploadToLocal,
  pollDocumentStatus,
} from './api/documents';
import type { HeroImageState } from 'components/form-fields';

/**
 * Result of uploading inline images
 */
export interface UploadInlineImagesResult {
  /** Mapping of placeholderId → CDN URL (for URL replacement in content) */
  urlMapping: Record<string, string>;
  /** Mapping of placeholderId → documentId (for tracking) */
  documentMapping: Record<string, string>;
  /** Document IDs for passing to backend */
  documentIds: string[];
  /** Placeholder IDs that failed to upload */
  failedIds: string[];
}

/**
 * Progress callback type
 */
export type UploadProgressCallback = (completed: number, total: number) => void;

/**
 * Single image upload result (internal)
 */
interface SingleUploadResult {
  placeholderId: string;
  documentId: string;
  cdnUrl: string;
}

/**
 * Uploads a single inline image via presigned URL flow
 *
 * @param imageState - The image state containing file and metadata
 * @returns Promise resolving to upload result with documentId and CDN URL
 */
async function uploadSingleImage(imageState: ImageState): Promise<SingleUploadResult> {
  const { file, placeholderId, filename } = imageState;

  // Step 1: Request presigned URL
  const presignResponse = await requestPresignedUrl({
    category: 'BLOG_INLINE_IMAGE',
    filename,
    contentType: file.type,
  });

  // Validate presign response (Issue #11 fix)
  if (!presignResponse.uploadUrl || !presignResponse.documentId) {
    throw new Error('Invalid presign response: missing uploadUrl or documentId');
  }

  // Step 2: Upload file (local mode uses POST, S3 uses PUT)
  if (presignResponse.localMode) {
    await uploadToLocal(presignResponse.documentId, file);
  } else {
    await uploadToS3(presignResponse.uploadUrl, file);
  }

  // Step 3: Poll for processing completion
  const statusResponse = await pollDocumentStatus(presignResponse.documentId);

  // Get the large variant URL (or original if no variants)
  const cdnUrl = statusResponse.variants?.large || statusResponse.variants?.original || '';

  if (!cdnUrl) {
    throw new Error(`No CDN URL returned for document ${presignResponse.documentId}`);
  }

  return {
    placeholderId,
    documentId: presignResponse.documentId,
    cdnUrl,
  };
}

/**
 * Uploads all inline images via presigned URLs
 *
 * Uses Promise.allSettled to handle partial failures gracefully.
 * All images are uploaded in parallel for better performance.
 *
 * @param inlineImages - Map of placeholderId → ImageState
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to upload results with mappings and failed IDs
 *
 * @example
 * ```typescript
 * const result = await uploadInlineImages(inlineImages, (completed, total) => {
 *   console.log(`Uploaded ${completed}/${total} images`);
 * });
 *
 * // Replace blob URLs with CDN URLs in content
 * const updatedContent = replaceImageUrls(content, result.urlMapping);
 *
 * // Send document IDs to backend
 * await createPost({ ...postData, inlineDocumentIds: result.documentIds });
 * ```
 */
export async function uploadInlineImages(
  inlineImages: Map<string, ImageState>,
  onProgress?: UploadProgressCallback
): Promise<UploadInlineImagesResult> {
  const result: UploadInlineImagesResult = {
    urlMapping: {},
    documentMapping: {},
    documentIds: [],
    failedIds: [],
  };

  // Handle empty input
  if (!inlineImages || inlineImages.size === 0) {
    return result;
  }

  const total = inlineImages.size;
  let completed = 0;

  // Create upload promises for all images
  const uploadPromises: Promise<SingleUploadResult>[] = [];
  const placeholderIds: string[] = [];

  inlineImages.forEach((imageState, placeholderId) => {
    placeholderIds.push(placeholderId);
    uploadPromises.push(
      uploadSingleImage(imageState).then((uploadResult) => {
        // Update progress after each successful upload
        completed++;
        onProgress?.(completed, total);
        return uploadResult;
      })
    );
  });

  // Execute all uploads in parallel
  const settledResults = await Promise.allSettled(uploadPromises);

  // Process results
  settledResults.forEach((settledResult, index) => {
    const placeholderId = placeholderIds[index];

    if (settledResult.status === 'fulfilled') {
      const { documentId, cdnUrl } = settledResult.value;
      result.urlMapping[placeholderId] = cdnUrl;
      result.documentMapping[placeholderId] = documentId;
      result.documentIds.push(documentId);
    } else {
      result.failedIds.push(placeholderId);
      // Still update progress for failed uploads
      completed++;
      onProgress?.(completed, total);
    }
  });

  return result;
}

/**
 * Replaces blob URLs in content with CDN URLs using placeholder ID mapping
 *
 * Looks for img tags with data-placeholder-id attributes and replaces
 * their src attributes with corresponding CDN URLs.
 *
 * @param content - HTML content with blob URLs
 * @param urlMapping - Mapping of placeholderId → CDN URL
 * @returns Object with updated content and replacement statistics
 */
export function replaceInlineImageUrls(
  content: string,
  urlMapping: Record<string, string>
): { content: string; replacedCount: number; missingIds: string[] } {
  let replacedCount = 0;
  const missingIds: string[] = [];
  let updatedContent = content;

  // Find all img tags with data-placeholder-id
  const imgRegex = /<img[^>]*data-placeholder-id="([^"]+)"[^>]*>/g;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const [fullMatch, placeholderId] = match;
    const cdnUrl = urlMapping[placeholderId];

    if (cdnUrl) {
      // Replace the src attribute with CDN URL
      const srcRegex = /src="[^"]*"/;
      const updatedTag = fullMatch.replace(srcRegex, `src="${cdnUrl}"`);
      updatedContent = updatedContent.replace(fullMatch, updatedTag);
      replacedCount++;
    } else {
      missingIds.push(placeholderId);
    }
  }

  return { content: updatedContent, replacedCount, missingIds };
}

// ============================================================================
// Hero Image Upload
// ============================================================================

/**
 * Result of uploading hero image
 */
export interface UploadHeroImageResult {
  /** Document ID for backend attachment */
  documentId: string;
  /** CDN URLs for different sizes */
  variants: {
    thumbnail?: string;
    medium?: string;
    large?: string;
    original: string;
  };
}

/**
 * Uploads hero image via presigned URL
 *
 * @param heroImageState - The hero image state containing file and metadata
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise resolving to upload result with documentId and variants
 *
 * @example
 * ```typescript
 * const result = await uploadHeroImage(heroImageState, (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 *
 * // Pass documentId to backend
 * await createPost({ ...postData, heroImageDocumentId: result.documentId });
 * ```
 */
export async function uploadHeroImage(
  heroImageState: HeroImageState,
  onProgress?: (progress: number) => void
): Promise<UploadHeroImageResult> {
  const { file, filename } = heroImageState;

  // Step 1: Request presigned URL
  const presignResponse = await requestPresignedUrl({
    category: 'BLOG_IMAGE',
    filename,
    contentType: file.type,
  });

  // Validate presign response
  if (!presignResponse.uploadUrl || !presignResponse.documentId) {
    throw new Error('Invalid presign response: missing uploadUrl or documentId');
  }

  // Step 2: Upload file (local mode uses POST, S3 uses PUT)
  if (presignResponse.localMode) {
    await uploadToLocal(presignResponse.documentId, file, onProgress);
  } else {
    await uploadToS3(presignResponse.uploadUrl, file, onProgress);
  }

  // Step 3: Poll for processing completion
  const statusResponse = await pollDocumentStatus(presignResponse.documentId);

  // Validate variants exist
  if (!statusResponse.variants) {
    throw new Error(`No variants returned for hero image document ${presignResponse.documentId}`);
  }

  return {
    documentId: presignResponse.documentId,
    variants: statusResponse.variants,
  };
}

/**
 * Revokes the blob URL from a hero image state
 * Call this after successful upload or when removing the image
 *
 * Note: This is safe to call even if the URL has already been revoked
 */
export function revokeHeroImageBlobUrl(heroImageState: HeroImageState | null): void {
  if (heroImageState?.blobUrl) {
    try {
      URL.revokeObjectURL(heroImageState.blobUrl);
    } catch (error) {
      // Revoking an already-revoked URL is not critical
    }
  }
}
