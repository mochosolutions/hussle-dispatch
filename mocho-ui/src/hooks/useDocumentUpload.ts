import { useState, useCallback, useRef } from 'react';
import type { DocumentCategory, DocumentUploadResult, ImageVariants } from '../types/documents';

/**
 * Upload state machine states
 */
export type UploadState =
  | 'idle'
  | 'requesting'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

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
 * Presigned URL response from API
 */
interface PresignedUrlResponse {
  uploadUrl: string;
  documentId: string;
  fields?: Record<string, string>;
}

/**
 * Document status response from API
 */
interface DocumentStatusResponse {
  status: 'pending' | 'processing' | 'complete' | 'error';
  variants?: ImageVariants;
  error?: string;
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
export function useDocumentUpload(options: UseDocumentUploadOptions): UseDocumentUploadReturn {
  const {
    category,
    onComplete,
    onError,
    apiBaseUrl = '',
    pollingInterval = 1000,
    maxPollingAttempts = 30,
  } = options;

  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentUploadResult | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clean up polling timeout
   */
  const clearPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Reset to idle state
   */
  const reset = useCallback(() => {
    clearPolling();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, [clearPolling]);

  /**
   * Cancel current upload
   */
  const cancel = useCallback(async () => {
    clearPolling();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState('idle');
    setProgress(0);
    setError(null);
  }, [clearPolling]);

  /**
   * Poll for document processing status
   */
  const pollStatus = useCallback(
    async (documentId: string, file: File, attempt: number = 0): Promise<void> => {
      if (attempt >= maxPollingAttempts) {
        const errorMsg = 'Processing timeout - please try again';
        setError(errorMsg);
        setState('error');
        onError?.(errorMsg);
        return;
      }

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/documents/${documentId}/status`,
          { signal: abortControllerRef.current?.signal }
        );

        if (!response.ok) {
          throw new Error('Failed to check processing status');
        }

        const data: DocumentStatusResponse = await response.json();

        if (data.status === 'complete' && data.variants) {
          const uploadResult: DocumentUploadResult = {
            documentId,
            variants: data.variants,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          };
          setResult(uploadResult);
          setState('complete');
          onComplete?.(uploadResult);
        } else if (data.status === 'error') {
          const errorMsg = data.error || 'Processing failed';
          setError(errorMsg);
          setState('error');
          onError?.(errorMsg);
        } else {
          // Still processing, poll again
          pollingTimeoutRef.current = setTimeout(() => {
            pollStatus(documentId, file, attempt + 1);
          }, pollingInterval);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return; // Cancelled
        }
        const errorMsg = 'Failed to check processing status';
        setError(errorMsg);
        setState('error');
        onError?.(errorMsg);
      }
    },
    [apiBaseUrl, maxPollingAttempts, pollingInterval, onComplete, onError]
  );

  /**
   * Upload file using presigned URL
   */
  const upload = useCallback(
    async (file: File): Promise<void> => {
      // Reset state
      reset();

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Step 1: Request presigned URL
        setState('requesting');
        setProgress(0);

        const presignedResponse = await fetch(`${apiBaseUrl}/api/documents/presigned-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            category,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, documentId, fields }: PresignedUrlResponse =
          await presignedResponse.json();

        // Step 2: Upload to presigned URL
        setState('uploading');

        const xhr = new XMLHttpRequest();

        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setProgress(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
          });

          // Build form data if fields provided (S3 presigned POST)
          if (fields) {
            const formData = new FormData();
            Object.entries(fields).forEach(([key, value]) => {
              formData.append(key, value);
            });
            formData.append('file', file);

            xhr.open('POST', uploadUrl, true);
            xhr.send(formData);
          } else {
            // Direct PUT to presigned URL
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
          }
        });

        // Step 3: Poll for processing status
        setState('processing');
        setProgress(100);
        await pollStatus(documentId, file);
      } catch (err) {
        if ((err as Error).name === 'AbortError' || (err as Error).message === 'Upload cancelled') {
          setState('idle');
          return;
        }

        const errorMsg = (err as Error).message || 'Upload failed';
        setError(errorMsg);
        setState('error');
        onError?.(errorMsg);
      }
    },
    [apiBaseUrl, category, pollStatus, reset, onError]
  );

  return {
    state,
    progress,
    error,
    result,
    upload,
    cancel,
    reset,
  };
}

export default useDocumentUpload;
