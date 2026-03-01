/**
 * Image Upload Error Utility
 *
 * Provides user-friendly error messages for image upload failures.
 * Maps HTTP status codes and error types to actionable messages.
 */
/**
 * Error types that can occur during image upload
 */
export declare enum ImageUploadErrorType {
    FILE_TOO_LARGE = "FILE_TOO_LARGE",
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    NETWORK_ERROR = "NETWORK_ERROR",
    SERVER_ERROR = "SERVER_ERROR",
    RATE_LIMIT = "RATE_LIMIT",
    UNAUTHORIZED = "UNAUTHORIZED",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
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
export declare function getErrorFromStatusCode(statusCode: number, responseBody?: any): ImageUploadError;
/**
 * Gets error message from a network/fetch error
 *
 * @param error - The caught error object
 * @returns Structured error information
 */
export declare function getErrorFromException(error: unknown): ImageUploadError;
/**
 * Parses error response and returns structured error
 *
 * @param response - Fetch Response object
 * @returns Structured error information
 */
export declare function parseErrorResponse(response: Response): Promise<ImageUploadError>;
/**
 * Formats an error for display in a notification or alert
 *
 * @param error - The structured error
 * @param includeDetails - Whether to include technical details (for debugging)
 * @returns Formatted error message
 */
export declare function formatErrorMessage(error: ImageUploadError, includeDetails?: boolean): string;
/**
 * Determines if an error is retriable based on the error type
 *
 * @param error - The structured error
 * @returns true if the operation can be retried
 */
export declare function isRetriableError(error: ImageUploadError): boolean;
/**
 * Gets a short error title for use in notifications
 *
 * @param error - The structured error
 * @returns Short error title
 */
export declare function getErrorTitle(error: ImageUploadError): string;
/**
 * Validates image file before upload attempt
 * Provides early validation to catch common errors
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes (default: 10)
 * @returns Error if invalid, null if valid
 */
export declare function validateImageBeforeUpload(file: File, maxSizeMB?: number): ImageUploadError | null;
//# sourceMappingURL=imageUploadErrors.d.ts.map