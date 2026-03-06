/**
 * Image Upload Error Utility
 *
 * Provides user-friendly error messages for image upload failures.
 * Maps HTTP status codes and error types to actionable messages.
 */

/**
 * Error types that can occur during image upload
 */
export enum ImageUploadErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured error information
 */
export interface ImageUploadError {
  type: ImageUploadErrorType;
  message: string;
  technicalDetails?: string;
  retryable: boolean;
  statusCode?: number;
}

/**
 * Maps HTTP status code to user-friendly error message
 *
 * @param statusCode - HTTP status code from the response
 * @param responseBody - Optional response body for additional context
 * @returns Structured error information
 */
export function getErrorFromStatusCode(
  statusCode: number,
  responseBody?: any
): ImageUploadError {
  switch (statusCode) {
    case 400:
      return {
        type: ImageUploadErrorType.VALIDATION_ERROR,
        message: 'Invalid image data. Please check your file and try again.',
        technicalDetails: responseBody?.error || 'Bad Request',
        retryable: false,
        statusCode,
      };

    case 401:
      return {
        type: ImageUploadErrorType.UNAUTHORIZED,
        message: 'Your session has expired. Please log in again.',
        technicalDetails: 'Unauthorized',
        retryable: false,
        statusCode,
      };

    case 413:
      return {
        type: ImageUploadErrorType.FILE_TOO_LARGE,
        message: 'Image file is too large. Maximum size is 10MB.',
        technicalDetails: 'Payload Too Large',
        retryable: false,
        statusCode,
      };

    case 415:
      return {
        type: ImageUploadErrorType.INVALID_FILE_TYPE,
        message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
        technicalDetails: 'Unsupported Media Type',
        retryable: false,
        statusCode,
      };

    case 429:
      return {
        type: ImageUploadErrorType.RATE_LIMIT,
        message: 'Too many upload attempts. Please try again in 1 hour.',
        technicalDetails: 'Too Many Requests',
        retryable: true,
        statusCode,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: ImageUploadErrorType.SERVER_ERROR,
        message: 'Server error. Your images were not uploaded. Please try again.',
        technicalDetails: responseBody?.error || 'Internal Server Error',
        retryable: true,
        statusCode,
      };

    default:
      return {
        type: ImageUploadErrorType.UNKNOWN_ERROR,
        message: `Unexpected error (${statusCode}). Please try again.`,
        technicalDetails: responseBody?.error || 'Unknown Error',
        retryable: true,
        statusCode,
      };
  }
}

/**
 * Gets error message from a network/fetch error
 *
 * @param error - The caught error object
 * @returns Structured error information
 */
export function getErrorFromException(error: unknown): ImageUploadError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ImageUploadErrorType.NETWORK_ERROR,
      message: 'Network connection failed. Please check your internet connection and try again.',
      technicalDetails: error.message,
      retryable: true,
    };
  }

  if (error instanceof Error) {
    return {
      type: ImageUploadErrorType.UNKNOWN_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      technicalDetails: error.message,
      retryable: true,
    };
  }

  return {
    type: ImageUploadErrorType.UNKNOWN_ERROR,
    message: 'An unexpected error occurred. Please try again.',
    technicalDetails: String(error),
    retryable: true,
  };
}

/**
 * Parses error response and returns structured error
 *
 * @param response - Fetch Response object
 * @returns Structured error information
 */
export async function parseErrorResponse(response: Response): Promise<ImageUploadError> {
  let responseBody: any;

  try {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = { error: await response.text() };
    }
  } catch {
    responseBody = { error: 'Failed to parse error response' };
  }

  return getErrorFromStatusCode(response.status, responseBody);
}

/**
 * Formats an error for display in a notification or alert
 *
 * @param error - The structured error
 * @param includeDetails - Whether to include technical details (for debugging)
 * @returns Formatted error message
 */
export function formatErrorMessage(
  error: ImageUploadError,
  includeDetails: boolean = false
): string {
  let message = error.message;

  if (includeDetails && error.technicalDetails) {
    message += `\n\nTechnical Details: ${error.technicalDetails}`;
  }

  if (error.retryable) {
    message += '\n\nYou can try uploading again.';
  }

  return message;
}

/**
 * Determines if an error is retriable based on the error type
 *
 * @param error - The structured error
 * @returns true if the operation can be retried
 */
export function isRetriableError(error: ImageUploadError): boolean {
  return error.retryable;
}

/**
 * Gets a short error title for use in notifications
 *
 * @param error - The structured error
 * @returns Short error title
 */
export function getErrorTitle(error: ImageUploadError): string {
  switch (error.type) {
    case ImageUploadErrorType.FILE_TOO_LARGE:
      return 'File Too Large';

    case ImageUploadErrorType.INVALID_FILE_TYPE:
      return 'Invalid File Type';

    case ImageUploadErrorType.NETWORK_ERROR:
      return 'Network Error';

    case ImageUploadErrorType.SERVER_ERROR:
      return 'Server Error';

    case ImageUploadErrorType.RATE_LIMIT:
      return 'Rate Limit Exceeded';

    case ImageUploadErrorType.UNAUTHORIZED:
      return 'Session Expired';

    case ImageUploadErrorType.VALIDATION_ERROR:
      return 'Validation Error';

    case ImageUploadErrorType.UNKNOWN_ERROR:
    default:
      return 'Upload Failed';
  }
}

/**
 * Validates image file before upload attempt
 * Provides early validation to catch common errors
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes (default: 10)
 * @returns Error if invalid, null if valid
 */
export function validateImageBeforeUpload(
  file: File,
  maxSizeMB: number = 10
): ImageUploadError | null {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      type: ImageUploadErrorType.INVALID_FILE_TYPE,
      message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      technicalDetails: `File type: ${file.type}`,
      retryable: false,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      type: ImageUploadErrorType.FILE_TOO_LARGE,
      message: `Image file is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
      technicalDetails: `File size: ${file.size} bytes`,
      retryable: false,
    };
  }

  return null;
}
