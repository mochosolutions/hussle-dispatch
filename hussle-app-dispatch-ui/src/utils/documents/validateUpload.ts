/**
 * Document upload validation utility.
 *
 * Pre-flight client-side checks for document uploads. Mirrors the validation
 * used by the driver portal (PortalDocumentUpload): JPEG / PNG / PDF only,
 * 10 MB hard cap.
 *
 * Returns a discriminated result so callers can render friendly toasts
 * instead of catching exceptions.
 */

/**
 * Allowed MIME types for document uploads.
 */
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

/**
 * Per-MIME upload size caps in bytes.
 *
 * Mirrors `MAX_FILE_SIZES` in the API (`documents/types/documentTypes.ts`).
 * The frontend is a UX guard only — the backend remains authoritative via
 * `s3:HeadObject` at confirm time.
 */
export const MAX_BYTES_BY_MIME: Record<string, number> = {
  'application/pdf': 5 * 1024 * 1024, // 5 MB
  'image/jpeg': 10 * 1024 * 1024, // 10 MB
  'image/png': 10 * 1024 * 1024, // 10 MB
};

/**
 * Distinct validation failure types.
 */
export enum UploadValidationErrorType {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}

/**
 * Structured validation error.
 */
export interface UploadValidationError {
  type: UploadValidationErrorType;
  message: string;
  technicalDetails?: string;
}

/**
 * Discriminated validation result.
 *
 * - `{ ok: true }` — file is acceptable
 * - `{ ok: false, error }` — file rejected with structured reason
 */
export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: UploadValidationError };

const isAllowedMime = (mime: string): boolean =>
  (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mime);

/**
 * Validate a file against the document upload contract.
 *
 * Allowed MIME types: image/jpeg, image/png, application/pdf.
 * Per-MIME size caps (see MAX_BYTES_BY_MIME).
 */
export const validateUpload = (file: File): UploadValidationResult => {
  if (!isAllowedMime(file.type)) {
    return {
      ok: false,
      error: {
        type: UploadValidationErrorType.INVALID_FILE_TYPE,
        message: 'Unsupported file type. Please upload a JPEG, PNG, or PDF.',
        technicalDetails: `File type: ${file.type}`,
      },
    };
  }

  const maxBytes = MAX_BYTES_BY_MIME[file.type];
  if (maxBytes !== undefined && file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false,
      error: {
        type: UploadValidationErrorType.FILE_TOO_LARGE,
        message: `File is too large. Maximum size for ${file.type} is ${String(maxMb)} MB.`,
        technicalDetails: `File size: ${String(file.size)} bytes`,
      },
    };
  }

  return { ok: true };
};
