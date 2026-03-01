import { DocumentCategory, DocumentUploadResult } from '../types/documents';
/**
 * Upload state machine states
 */
export type UploadState = 'idle' | 'requesting' | 'uploading' | 'processing' | 'complete' | 'error';
/**
 * Options for useDocumentUpload hook
 */
export interface UseDocumentUploadOptions {
    /** Document category for upload */
    category: DocumentCategory;
    /** Callback when upload completes successfully */
    onComplete?: (result: DocumentUploadResult) => void;
    /** Callback when upload fails */
    onError?: (error: string) => void;
    /** API base URL (defaults to window.location.origin) */
    apiBaseUrl?: string;
    /** Polling interval for processing status (ms) */
    pollingInterval?: number;
    /** Maximum polling attempts */
    maxPollingAttempts?: number;
}
/**
 * Return type for useDocumentUpload hook
 */
export interface UseDocumentUploadReturn {
    /** Current upload state */
    state: UploadState;
    /** Upload progress percentage (0-100) */
    progress: number;
    /** Error message if state is 'error' */
    error: string | null;
    /** Upload result if state is 'complete' */
    result: DocumentUploadResult | null;
    /** Start upload with a file */
    upload: (file: File) => Promise<void>;
    /** Cancel current upload */
    cancel: () => Promise<void>;
    /** Reset to idle state */
    reset: () => void;
}
/**
 * Hook for uploading documents using presigned URLs with processing status polling.
 *
 * Flow:
 * 1. Request presigned URL from API
 * 2. Upload file directly to storage (S3)
 * 3. Poll for processing status
 * 4. Return processed image variants
 */
export declare function useDocumentUpload(options: UseDocumentUploadOptions): UseDocumentUploadReturn;
export default useDocumentUpload;
//# sourceMappingURL=useDocumentUpload.d.ts.map