/**
 * Document types for the shared UI library
 */
/**
 * Categories for document uploads
 */
export type DocumentCategory = 'image' | 'document' | 'avatar' | 'hero' | 'inline';
/**
 * Image variant sizes returned after processing
 */
export interface ImageVariants {
    original: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
}
/**
 * Result of a successful document upload
 */
export interface DocumentUploadResult {
    documentId: string;
    variants: ImageVariants;
    filename: string;
    mimeType: string;
    size: number;
}
/**
 * Configuration for document upload
 */
export interface DocumentUploadConfig {
    /** API endpoint for requesting presigned URL */
    requestUrl: string;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Allowed MIME types */
    allowedTypes?: string[];
    /** Polling interval for processing status (ms) */
    pollingInterval?: number;
    /** Maximum polling attempts */
    maxPollingAttempts?: number;
}
//# sourceMappingURL=documents.d.ts.map